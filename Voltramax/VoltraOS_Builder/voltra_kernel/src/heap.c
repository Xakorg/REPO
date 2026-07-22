/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - SLAB ALLOCATOR IMPLEMENTATION
 * ============================================================================
 * 
 * This file implements the SLAB allocator described in heap.h.
 * 
 * HOW THE FAST-PATH ALLOCATION WORKS:
 * When `kmem_cache_alloc` is called:
 * 1. We check the `slabs_partial` list. If a slab exists, we pop the first 
 *    free object index (O(1)).
 * 2. If `slabs_partial` is empty, we check `slabs_free`.
 * 3. If everything is full, we hit the "Slow Path": we call `alloc_pages()` 
 *    from the Buddy Allocator (pmm.c) to get a fresh 4KB physical page, 
 *    format it as a new slab, carve it into objects, append it to `slabs_free`, 
 *    and then retry step 1.
 * 
 * THE FREE-LIST TRICK:
 * To avoid wasting memory on linked-list pointers for free objects, 
 * we use the memory of the *unallocated* object itself to store the 
 * index of the *next* free object. This is a classic low-level C trick.
 * ============================================================================
 */

#include "heap.h"
#include "pmm.h"
#include "string.h"

// The general-purpose kmalloc caches (8, 16, 32, 64, 128, 256, 512, 1024, 2048)
#define NUM_GENERAL_CACHES 9
kmem_cache_t* kmalloc_caches[NUM_GENERAL_CACHES];

// We need a specialized cache just to allocate `kmem_cache_t` structures!
// This solves the chicken-and-egg problem of memory allocation.
kmem_cache_t cache_cache;

// ----------------------------------------------------------------------------
// ATOMIC SPINLOCKS (For SMP)
// ----------------------------------------------------------------------------
static inline void spin_lock(volatile uint32_t *lock) {
    asm volatile("1: lock btsl $0, %0; jc 1b" : "+m" (*lock) :: "memory");
}
static inline void spin_unlock(volatile uint32_t *lock) {
    asm volatile("lock btrl $0, %0" : "+m" (*lock) :: "memory");
}

// ----------------------------------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------------------------------

void kmem_init() {
    // 1. Initialize the root 'cache_cache' manually.
    // This cache manages memory for all other cache structures.
    strcpy(cache_cache.name, "kmem_cache");
    cache_cache.object_size = sizeof(kmem_cache_t);
    cache_cache.align = 8;
    cache_cache.slabs_full = NULL;
    cache_cache.slabs_partial = NULL;
    cache_cache.slabs_free = NULL;
    cache_cache.lock = 0;
    
    // 2. Initialize the general-purpose kmalloc caches
    uint32_t size = 8;
    for (int i = 0; i < NUM_GENERAL_CACHES; i++) {
        char name[32];
        // Generate name: "kmalloc-8", "kmalloc-16", etc.
        // (Assuming a simple strcpy/strcat implementation exists in string.h)
        strcpy(name, "kmalloc-");
        kmalloc_caches[i] = kmem_cache_create(name, size, 8, 0);
        size *= 2;
    }
}

// ----------------------------------------------------------------------------
// CACHE CREATION
// ----------------------------------------------------------------------------

kmem_cache_t* kmem_cache_create(const char* name, uint32_t size, uint32_t align, uint32_t flags) {
    // Allocate the structure from our root cache
    kmem_cache_t* cache = (kmem_cache_t*)kmem_cache_alloc(&cache_cache);
    if (!cache) return NULL;
    
    strcpy(cache->name, name);
    
    // Ensure size is aligned (e.g., if size is 13, and align is 8, bump to 16)
    if (size % align != 0) {
        size += align - (size % align);
    }
    
    // Objects must be at least large enough to hold a 32-bit integer for the free-list trick
    if (size < 4) size = 4;
    
    cache->object_size = size;
    cache->align = align;
    cache->flags = flags;
    cache->slabs_full = NULL;
    cache->slabs_partial = NULL;
    cache->slabs_free = NULL;
    cache->lock = 0;
    
    return cache;
}

// ----------------------------------------------------------------------------
// ALLOCATION LOGIC (The Fast Path & Slow Path)
// ----------------------------------------------------------------------------

/**
 * Internal helper to format a raw 4KB Buddy Page into a SLAB.
 */
static slab_t* cache_grow(kmem_cache_t* cache) {
    // 1. Ask Buddy Allocator for a raw physical page (Order 0)
    page_t* raw_page = alloc_page(ZONE_NORMAL);
    if (!raw_page) return NULL;
    
    uint32_t phys_addr = page_to_phys(raw_page);
    
    // 2. We place the `slab_t` metadata struct at the very BEGINNING of the page.
    // The rest of the page is carved into objects.
    slab_t* slab = (slab_t*)phys_addr;
    slab->s_mem = (void*)(phys_addr + sizeof(slab_t));
    slab->inuse = 0;
    slab->next = NULL;
    slab->prev = NULL;
    
    // 3. Carve the page into objects and set up the Free-List Trick.
    uint32_t usable_memory = PAGE_SIZE - sizeof(slab_t);
    uint32_t num_objects = usable_memory / cache->object_size;
    
    char* obj_ptr = (char*)slab->s_mem;
    for (uint32_t i = 0; i < num_objects - 1; i++) {
        // Write the index of the *next* free object into the current object's memory space
        *((uint32_t*)obj_ptr) = i + 1;
        obj_ptr += cache->object_size;
    }
    // Last object points to an invalid index to signal End-Of-List
    *((uint32_t*)obj_ptr) = 0xFFFFFFFF; 
    
    slab->free = 0; // The first free object is at index 0
    
    // Add to cache's free list
    slab->next = cache->slabs_free;
    if (cache->slabs_free) cache->slabs_free->prev = slab;
    cache->slabs_free = slab;
    
    return slab;
}

void* kmem_cache_alloc(kmem_cache_t* cache) {
    spin_lock(&cache->lock);
    
    slab_t* slab = cache->slabs_partial;
    
    // If no partial slabs, check free slabs
    if (!slab) {
        slab = cache->slabs_free;
        if (!slab) {
            // SLOW PATH: Cache is completely empty. Grow it.
            slab = cache_grow(cache);
            if (!slab) {
                spin_unlock(&cache->lock);
                return NULL; // Out of memory!
            }
        }
        
        // Move slab from slabs_free to slabs_partial
        cache->slabs_free = slab->next;
        if (cache->slabs_free) cache->slabs_free->prev = NULL;
        
        slab->next = cache->slabs_partial;
        if (cache->slabs_partial) cache->slabs_partial->prev = slab;
        cache->slabs_partial = slab;
        slab->prev = NULL;
    }
    
    // FAST PATH: We have a slab with free space.
    // Calculate the memory address of the free object
    void* obj = (char*)slab->s_mem + (slab->free * cache->object_size);
    
    // Read the *next* free index out of the object's memory before we give it to the caller
    slab->free = *((uint32_t*)obj);
    slab->inuse++;
    
    // If slab is now full, move it from partial to full list
    if (slab->free == 0xFFFFFFFF) {
        if (slab->prev) slab->prev->next = slab->next;
        if (slab->next) slab->next->prev = slab->prev;
        if (cache->slabs_partial == slab) cache->slabs_partial = slab->next;
        
        slab->next = cache->slabs_full;
        if (cache->slabs_full) cache->slabs_full->prev = slab;
        cache->slabs_full = slab;
        slab->prev = NULL;
    }
    
    spin_unlock(&cache->lock);
    return obj;
}

// ----------------------------------------------------------------------------
// KMALLOC (GENERAL PURPOSE)
// ----------------------------------------------------------------------------

void* kmalloc(uint32_t size) {
    // Find the smallest general-purpose cache that fits the request
    uint32_t c_size = 8;
    for (int i = 0; i < NUM_GENERAL_CACHES; i++) {
        if (size <= c_size) {
            return kmem_cache_alloc(kmalloc_caches[i]);
        }
        c_size *= 2;
    }
    
    // If request is larger than 2048 bytes, fallback to Buddy Allocator directly
    // Calculate order needed
    uint32_t order = 0;
    uint32_t p_size = PAGE_SIZE;
    while (p_size < size) {
        order++;
        p_size *= 2;
    }
    page_t* p = alloc_pages(order, ZONE_NORMAL);
    if (!p) return NULL;
    return (void*)page_to_phys(p);
}
