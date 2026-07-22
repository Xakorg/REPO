/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - SLAB ALLOCATOR (KERNEL HEAP)
 * ============================================================================
 * 
 * DESCRIPTION:
 * The Buddy Allocator (pmm.c) is great for allocating large blocks of 4KB 
 * pages, but the kernel often needs tiny objects (e.g., 64-byte file 
 * descriptors or 128-byte Task Control Blocks). If we gave 4KB of RAM for 
 * every 64-byte request, memory would be exhausted instantly (internal fragmentation).
 * 
 * To solve this, VoltraOS implements a true SLAB Allocator.
 * 
 * CORE CONCEPTS:
 * 1. Caches: A `kmem_cache_t` is created for a specific object type 
 *    (e.g., "task_struct", size 256 bytes). 
 * 2. Slabs: A cache consists of one or more "slabs". A slab is a contiguous 
 *    block of memory (acquired from the Buddy Allocator) that is carved up 
 *    into equal-sized objects of the cache's type.
 * 3. Fast Paths: Allocating an object from a cache is extremely fast O(1), 
 *    because the cache maintains a LIFO queue of free objects.
 * 4. General Purpose Caches: For arbitrary `kmalloc(size)` calls, we pre-create
 *    caches of power-of-two sizes (8, 16, 32, 64 ... 2048 bytes).
 * 
 * HARDWARE CACHE ALIGNMENT:
 * Objects are aligned to CPU cache lines (L1/L2) to prevent false-sharing 
 * in our multi-core (SMP) architecture.
 * ============================================================================
 */

#ifndef SLAB_H
#define SLAB_H

#include <stdint.h>
#include <stddef.h>

// ----------------------------------------------------------------------------
// STRUCTURES
// ----------------------------------------------------------------------------

/**
 * struct slab: Represents a single page (or block of pages) carved into objects.
 */
typedef struct slab {
    struct slab* next;      // Next slab in the cache's list
    struct slab* prev;
    void* s_mem;            // Pointer to the start of the memory for the objects
    uint32_t inuse;         // Number of allocated objects in this slab
    uint32_t free;          // Index of the next free object
    uint16_t nodeid;        // NUMA node (for future expansion)
} slab_t;

/**
 * struct kmem_cache: The master controller for a specific object type.
 */
typedef struct kmem_cache {
    char name[32];          // Human-readable name (e.g., "task_struct")
    uint32_t object_size;   // Size of each object in bytes
    uint32_t align;         // CPU cache alignment
    uint32_t flags;
    
    // Slabs are organized by state to optimize search speed
    slab_t* slabs_full;     // List of slabs where every object is allocated
    slab_t* slabs_partial;  // List of slabs with a mix of free and used objects
    slab_t* slabs_free;     // List of slabs where every object is completely free
    
    // SMP Spinlock
    volatile uint32_t lock;
    
    // Next cache in the global cache list
    struct kmem_cache* next;
} kmem_cache_t;

// ----------------------------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------------------------

/**
 * @brief Initializes the SLAB Allocator system. 
 * Creates the internal caches required for kmalloc.
 */
void kmem_init();

/**
 * @brief Creates a specialized cache for a specific object type.
 * @param name Cache name (for debugging).
 * @param size Size of the object in bytes.
 * @param align Required CPU alignment.
 * @param flags Cache creation flags.
 * @return Pointer to the new cache.
 */
kmem_cache_t* kmem_cache_create(const char* name, uint32_t size, uint32_t align, uint32_t flags);

/**
 * @brief Allocates an object from a specific cache.
 * @param cache The cache to allocate from.
 * @return Pointer to the newly allocated object (O(1) time complexity).
 */
void* kmem_cache_alloc(kmem_cache_t* cache);

/**
 * @brief Frees an object back to its specific cache.
 * @param cache The cache the object belongs to.
 * @param objp Pointer to the object.
 */
void kmem_cache_free(kmem_cache_t* cache, void* objp);

/**
 * @brief General purpose kernel memory allocation.
 * Finds the appropriate power-of-two cache and allocates from it.
 * @param size Requested size in bytes.
 * @return Pointer to the allocated memory.
 */
void* kmalloc(uint32_t size);

/**
 * @brief Frees general purpose kernel memory.
 * Uses pointer arithmetic to identify which slab/cache the memory belongs to.
 * @param objp Pointer to the memory to free.
 */
void kfree(void* objp);

#endif // SLAB_H
