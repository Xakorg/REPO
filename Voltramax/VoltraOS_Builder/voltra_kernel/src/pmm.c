/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - PHYSICAL MEMORY MANAGER (BUDDY ALLOCATOR)
 * ============================================================================
 * 
 * This file contains the implementation of the VoltraOS Buddy Allocator.
 * 
 * HOW IT WORKS (THE MATHEMATICS OF THE BUDDY SYSTEM):
 * 1. Physical memory is divided into an array of `page_t` structures (mem_map).
 * 2. A block of memory has an "order". Order O means the block contains 2^O pages.
 * 3. Two blocks are "buddies" if they are of the same order O, and they are 
 *    adjacent in physical memory such that their starting addresses differ 
 *    by exactly 2^O pages, AND they are aligned to 2^(O+1) pages.
 * 
 * BUDDY CALCULATION:
 * Given a page frame number (PFN) and an order O:
 *    Buddy PFN = PFN ^ (1 << O)
 * 
 * Using XOR (^) for the calculation is mathematically beautiful because applying 
 * it twice returns you to the original PFN. This makes checking if a buddy 
 * is free an extremely fast O(1) bitwise operation.
 * 
 * COALESCING:
 * When freeing a block of order O, we calculate its buddy. If the buddy is 
 * also free, we merge them into a single block of order O+1. We then repeat 
 * the process for the new block until we hit a buddy that is allocated or 
 * we reach MAX_ORDER.
 * ============================================================================
 */

#include "pmm.h"
#include "vga.h"    // For kernel panic/printing
#include "string.h" // For memset

// Global Array tracking EVERY physical page in the system.
// This is allocated dynamically during boot based on total RAM.
page_t* mem_map = NULL;
uint32_t total_pages = 0;

// The Zones
zone_t zones[MAX_ZONES];

// ----------------------------------------------------------------------------
// ATOMIC SPINLOCKS (For SMP Thread Safety)
// ----------------------------------------------------------------------------
// In an enterprise OS, multiple CPU cores might try to allocate memory 
// simultaneously. We must use hardware-level atomic instructions to lock 
// the zone before modifying the free lists.

static inline void spin_lock(volatile uint32_t *lock) {
    // x86 atomic exchange instruction. 
    // Spins until it successfully writes 1 to the lock and reads 0.
    asm volatile(
        "1: \n\t"
        "lock btsl $0, %0 \n\t"
        "jc 1b \n\t"
        : "+m" (*lock)
        : 
        : "memory"
    );
}

static inline void spin_unlock(volatile uint32_t *lock) {
    // x86 atomic clear
    asm volatile(
        "lock btrl $0, %0 \n\t"
        : "+m" (*lock)
        : 
        : "memory"
    );
}

// ----------------------------------------------------------------------------
// INTERNAL HELPERS
// ----------------------------------------------------------------------------

/**
 * @brief Removes a page from a free_area list.
 */
static void list_del(page_t* page, free_area_t* area) {
    if (page->prev) page->prev->next = page->next;
    if (page->next) page->next->prev = page->prev;
    if (area->free_list == page) area->free_list = page->next;
    area->nr_free--;
    page->next = NULL;
    page->prev = NULL;
}

/**
 * @brief Adds a page to the front of a free_area list.
 */
static void list_add(page_t* page, free_area_t* area) {
    page->next = area->free_list;
    page->prev = NULL;
    if (area->free_list) {
        area->free_list->prev = page;
    }
    area->free_list = page;
    area->nr_free++;
}

// ----------------------------------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------------------------------

void pmm_init(uint32_t mem_size, uint32_t mmap_addr, uint32_t mmap_length) {
    // 1. Calculate total pages
    total_pages = mem_size / PAGE_SIZE;
    
    // 2. Allocate the mem_map array right after the kernel image.
    // In a real scenario, this relies on a boot allocator. For this architecture,
    // we assume the kernel ends at 0x100000 + kernel_size, and we place mem_map there.
    uint32_t mem_map_addr = 0x200000; // Hardcoded safe spot for demonstration
    mem_map = (page_t*)mem_map_addr;
    
    // Initialize all pages as RESERVED initially.
    for (uint32_t i = 0; i < total_pages; i++) {
        mem_map[i].flags = 1; // 1 = PG_reserved
        mem_map[i].reference_count = 0;
        mem_map[i].order = 0;
        mem_map[i].next = NULL;
        mem_map[i].prev = NULL;
    }
    
    // 3. Initialize Zones
    for (int i = 0; i < MAX_ZONES; i++) {
        zones[i].zone_id = i;
        zones[i].lock = 0; // Unlocked
        for (int o = 0; o < MAX_ORDER; o++) {
            zones[i].free_area[o].free_list = NULL;
            zones[i].free_area[o].nr_free = 0;
        }
    }
    
    // Define zone boundaries (Simplified for VoltraOS Architecture)
    // ZONE_DMA: 0MB to 16MB
    zones[ZONE_DMA].start_pfn = 0;
    zones[ZONE_DMA].spanned_pages = (16 * 1024 * 1024) / PAGE_SIZE;
    
    // ZONE_NORMAL: 16MB to 896MB
    zones[ZONE_NORMAL].start_pfn = zones[ZONE_DMA].spanned_pages;
    zones[ZONE_NORMAL].spanned_pages = ((896 - 16) * 1024 * 1024) / PAGE_SIZE;
    if (total_pages < zones[ZONE_NORMAL].start_pfn + zones[ZONE_NORMAL].spanned_pages) {
        zones[ZONE_NORMAL].spanned_pages = total_pages - zones[ZONE_NORMAL].start_pfn;
    }

    // 4. Parse the Multiboot Memory Map (Simulated here)
    // We would loop through mmap_addr and find available regions.
    // For every available region, we call `free_pages(page, 0)` to inject 
    // the RAM into the buddy system, which will automatically coalesce it 
    // into MAX_ORDER blocks!
    
    // (Simulating injection of pages from 16MB to 128MB)
    uint32_t start_usable = (16 * 1024 * 1024) / PAGE_SIZE;
    uint32_t end_usable = (128 * 1024 * 1024) / PAGE_SIZE; // 128MB RAM total
    
    for (uint32_t pfn = start_usable; pfn < end_usable; pfn++) {
        mem_map[pfn].flags = 0; // Mark as usable
        free_pages(&mem_map[pfn], 0); // Inject into Buddy System
    }
}

// ----------------------------------------------------------------------------
// ALLOCATION LOGIC
// ----------------------------------------------------------------------------

page_t* alloc_pages(uint32_t order, uint32_t zone_flags) {
    if (order >= MAX_ORDER) return NULL; // Invalid request
    
    zone_t* zone = &zones[zone_flags];
    page_t* page = NULL;
    
    // Lock the zone to prevent SMP race conditions
    spin_lock(&zone->lock);

    // Step 1: Find a block of the requested order, or higher.
    uint32_t current_order;
    for (current_order = order; current_order < MAX_ORDER; current_order++) {
        if (zone->free_area[current_order].free_list != NULL) {
            // Found a free block!
            page = zone->free_area[current_order].free_list;
            list_del(page, &zone->free_area[current_order]);
            break;
        }
    }

    // If no block was found, memory is exhausted.
    if (!page) {
        spin_unlock(&zone->lock);
        return NULL;
    }

    // Step 2: Split the block down to the requested order.
    // If we needed Order 1 (2 pages), but found Order 3 (8 pages),
    // we must split the 8-page block into two 4-page blocks,
    // put one back in the Order 2 list, take the other 4-page block,
    // split it into two 2-page blocks, put one back in the Order 1 list,
    // and keep the final 2-page block for the caller.
    while (current_order > order) {
        current_order--;
        
        // The size (in pages) of the lower order block
        uint32_t buddy_size = (1 << current_order);
        
        // Calculate the address of the right half (the buddy)
        // Since `page` is a pointer to the array, adding buddy_size advances the pointer correctly.
        page_t* buddy = page + buddy_size;
        
        // Set the buddy's order and add it to the free list
        buddy->order = current_order;
        buddy->flags = 0; // Free
        list_add(buddy, &zone->free_area[current_order]);
    }
    
    // Mark the final block as allocated
    page->flags = 1; // PG_allocated
    page->order = order;
    page->reference_count = 1;

    spin_unlock(&zone->lock);
    return page;
}

page_t* alloc_page(uint32_t zone_flags) {
    return alloc_pages(0, zone_flags);
}

// ----------------------------------------------------------------------------
// FREEING LOGIC
// ----------------------------------------------------------------------------

void free_pages(page_t* page, uint32_t order) {
    if (!page || order >= MAX_ORDER) return;

    // Determine which zone this page belongs to based on PFN
    uint32_t pfn = page - mem_map;
    zone_t* zone = NULL;
    for (int i = 0; i < MAX_ZONES; i++) {
        if (pfn >= zones[i].start_pfn && pfn < zones[i].start_pfn + zones[i].spanned_pages) {
            zone = &zones[i];
            break;
        }
    }
    if (!zone) return; // Critical Error: Page out of bounds!

    spin_lock(&zone->lock);

    // Coalescing Loop
    while (order < MAX_ORDER - 1) {
        // Find the buddy PFN using XOR arithmetic
        uint32_t buddy_pfn = pfn ^ (1 << order);
        page_t* buddy = &mem_map[buddy_pfn];

        // Is the buddy actually free, and of the same order?
        // (If buddy->flags == 1, it is allocated and cannot be merged).
        if (buddy->flags != 0 || buddy->order != order) {
            break; // Cannot coalesce further
        }

        // Buddy is free! Remove it from its current free list
        list_del(buddy, &zone->free_area[order]);

        // Merge them: the new block starts at the lower PFN
        if (buddy_pfn < pfn) {
            page = buddy;
            pfn = buddy_pfn;
        }

        order++; // We now have a block of the next higher order.
    }

    // Add the fully coalesced block to the free list
    page->flags = 0;
    page->order = order;
    page->reference_count = 0;
    list_add(page, &zone->free_area[order]);

    spin_unlock(&zone->lock);
}

void free_page(page_t* page) {
    free_pages(page, 0);
}

// ----------------------------------------------------------------------------
// TRANSLATION LOGIC
// ----------------------------------------------------------------------------

uint32_t page_to_phys(page_t* page) {
    uint32_t pfn = page - mem_map;
    return pfn * PAGE_SIZE;
}

page_t* phys_to_page(uint32_t phys_addr) {
    uint32_t pfn = phys_addr / PAGE_SIZE;
    return &mem_map[pfn];
}
