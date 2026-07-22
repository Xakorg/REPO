/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - PHYSICAL MEMORY MANAGER (BUDDY ALLOCATOR)
 * ============================================================================
 * 
 * DESCRIPTION:
 * This header defines the public interface and internal structures for the 
 * VoltraOS Physical Memory Manager (PMM). Unlike simple bitmap allocators 
 * which suffer from severe fragmentation and O(N) search times, this PMM 
 * implements an Enterprise-Grade "Buddy Memory Allocator" similar to the 
 * one found in the Linux Kernel.
 * 
 * CORE CONCEPTS:
 * 1. The Buddy System: Memory is split into halves (buddies) to satisfy 
 *    requests. When freed, adjacent buddies are coalesced back into larger 
 *    blocks. This minimizes external fragmentation.
 * 2. Orders: Memory blocks are tracked in power-of-two sizes, referred to 
 *    as "orders". An order 0 block is a single page (4KB). An order 1 block 
 *    is 2 pages (8KB), order 2 is 4 pages (16KB), up to order MAX_ORDER.
 * 3. Zones: Physical memory is partitioned into Zones (e.g., ZONE_DMA for 
 *    ISA devices that need <16MB, ZONE_NORMAL for general use, ZONE_HIGHMEM).
 * 
 * ARCHITECTURE:
 * - Free lists are maintained for each order within each zone.
 * - Hardware spinlocks ensure Thread/SMP safety when allocating/freeing.
 * ============================================================================
 */

#ifndef PMM_H
#define PMM_H

#include <stdint.h>
#include <stddef.h>

#define PAGE_SIZE 4096
#define MAX_ORDER 11 // Max order 10 means blocks up to 1024 pages (4MB)

// Memory Zones for Hardware Constraints
#define ZONE_DMA      0  // Below 16MB (For legacy ISA DMA)
#define ZONE_NORMAL   1  // 16MB - 896MB (Directly mapped in kernel space)
#define ZONE_HIGHMEM  2  // >896MB (Requires temporary mapping to access)
#define MAX_ZONES     3

// ----------------------------------------------------------------------------
// STRUCTURES
// ----------------------------------------------------------------------------

/**
 * struct page: The fundamental descriptor for physical memory.
 * EVERY physical 4KB frame in the system has one of these structs.
 * 
 * size: 32 bytes (optimized for cache lines)
 */
typedef struct page {
    uint32_t flags;            // State flags (PG_reserved, PG_locked, etc.)
    uint32_t reference_count;  // How many virtual pages map to this physical frame (for Copy-on-Write)
    struct page* next;         // Pointer for free-lists within the buddy allocator
    struct page* prev;
    uint32_t order;            // The current order of this block if it's the head of a free block
    uint32_t private_data;     // Used by SLAB allocator or VFS later
    uint32_t mapping;          // Pointer to address_space if mapped to a file
    uint32_t index;            // Offset within the mapping
} page_t;

/**
 * struct free_area: Represents a list of free blocks of a specific order.
 */
typedef struct free_area {
    page_t* free_list;         // Linked list of free blocks of this size
    uint32_t nr_free;          // Number of free blocks in this list
} free_area_t;

/**
 * struct zone: Represents a region of physical memory.
 */
typedef struct zone {
    uint32_t zone_id;
    uint32_t start_pfn;        // Starting Page Frame Number
    uint32_t spanned_pages;    // Total pages in this zone
    uint32_t present_pages;    // Total usable pages (excluding BIOS reserved)
    
    // The buddy lists: one list for each order 0..MAX_ORDER-1
    free_area_t free_area[MAX_ORDER];
    
    // Spinlock for SMP thread safety (atomic lock)
    volatile uint32_t lock;
    
    // Pointer to the first page_t struct in this zone
    page_t* zone_mem_map;
} zone_t;

// ----------------------------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------------------------

/**
 * @brief Initializes the Physical Memory Manager.
 * Scans the multiboot memory map to determine available RAM, builds the 
 * zone structures, allocates the global page array (mem_map), and marks 
 * reserved BIOS/Kernel areas as unavailable.
 * 
 * @param mem_size Total memory size in bytes.
 * @param mmap_addr Address of the multiboot mmap structure.
 * @param mmap_length Length of the mmap structure.
 */
void pmm_init(uint32_t mem_size, uint32_t mmap_addr, uint32_t mmap_length);

/**
 * @brief Allocates 2^order continuous physical pages.
 * @param order The power-of-two size to allocate (0 = 1 page, 1 = 2 pages).
 * @param zone_flags Which zone to allocate from (ZONE_NORMAL, etc.).
 * @return Pointer to the first page_t struct of the allocated block.
 */
page_t* alloc_pages(uint32_t order, uint32_t zone_flags);

/**
 * @brief Convenience function to allocate a single 4KB page.
 * @param zone_flags Which zone to allocate from.
 * @return Pointer to the page_t struct.
 */
page_t* alloc_page(uint32_t zone_flags);

/**
 * @brief Frees a previously allocated block of pages back to the Buddy System.
 * Automatically checks for adjacent "buddies" and coalesces them into 
 * higher-order blocks to prevent fragmentation.
 * 
 * @param page Pointer to the page_t struct to free.
 * @param order The order of the block being freed.
 */
void free_pages(page_t* page, uint32_t order);

/**
 * @brief Convenience function to free a single 4KB page.
 * @param page Pointer to the page_t struct.
 */
void free_page(page_t* page);

/**
 * @brief Translates a page_t struct pointer to an actual physical RAM address.
 * @param page Pointer to the page_t struct.
 * @return The physical address in RAM (e.g., 0x100000).
 */
uint32_t page_to_phys(page_t* page);

/**
 * @brief Translates a physical RAM address to its corresponding page_t struct.
 * @param phys_addr The physical address.
 * @return Pointer to the page_t struct.
 */
page_t* phys_to_page(uint32_t phys_addr);

// ----------------------------------------------------------------------------
// DEBUGGING API
// ----------------------------------------------------------------------------
void pmm_dump_stats();

#endif // PMM_H
