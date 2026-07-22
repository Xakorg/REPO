/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - VIRTUAL MEMORY MANAGER (VMM)
 * ============================================================================
 * 
 * DESCRIPTION:
 * While the PMM (Buddy) and Heap (SLAB) manage raw physical memory, the 
 * Virtual Memory Manager (VMM) is responsible for hardware paging. 
 * VoltraOS implements a 4-level paging hierarchy (PML4, PDP, PD, PT) for 
 * strict 64-bit address space isolation.
 * 
 * CORE ARCHITECTURE:
 * 1. Isolation: Every User Mode (Ring 3) application gets its own completely 
 *    isolated virtual address space (its own PML4).
 * 2. Copy-on-Write (CoW): When an app forks or duplicates memory, the VMM 
 *    does NOT copy physical RAM. It maps both apps to the same physical page 
 *    and marks it "Read-Only". If either app tries to write, a Page Fault (PF) 
 *    triggers, and the VMM dynamically duplicates the physical page.
 * 3. Demand Paging: Programs are loaded into memory lazily. When executed, 
 *    only the first page is mapped. As the program executes and accesses new 
 *    memory, Page Faults trigger the VMM to allocate and map RAM on-the-fly.
 * 4. TLB Shootdown (SMP): If Core 0 unmaps a page that Core 1 is using, 
 *    Core 0 fires an Inter-Processor Interrupt (IPI) to force Core 1 to 
 *    flush its Translation Lookaside Buffer (TLB).
 * ============================================================================
 */

#ifndef VMM_H
#define VMM_H

#include <stdint.h>
#include <stdbool.h>
#include "pmm.h"

// ----------------------------------------------------------------------------
// X86_64 PAGING STRUCTURES (Hardware Defined)
// ----------------------------------------------------------------------------
// x86 pages are strictly 4KB aligned.

#define PAGE_PRESENT  (1 << 0)
#define PAGE_WRITE    (1 << 1)
#define PAGE_USER     (1 << 2)
#define PAGE_WRITETHRU(1 << 3)
#define PAGE_NOCACHE  (1 << 4)
#define PAGE_ACCESSED (1 << 5)
#define PAGE_DIRTY    (1 << 6)
#define PAGE_COW      (1 << 9)  // Custom OS flag: Copy-on-Write
#define PAGE_GLOBAL   (1 << 8)
#define PAGE_NX       (1ULL << 63) // No-Execute (Data Execution Prevention)

/**
 * A standard 64-bit Page Table Entry.
 */
typedef uint64_t pt_entry_t;

/**
 * A Page Table (PT) containing 512 entries mapping to 4KB physical frames.
 */
typedef struct page_table {
    pt_entry_t entries[512];
} __attribute__((aligned(4096))) page_table_t;

/**
 * A Page Directory (PD) containing 512 entries mapping to Page Tables.
 */
typedef struct page_directory {
    pt_entry_t entries[512];
} __attribute__((aligned(4096))) page_directory_t;

/**
 * A Page Directory Pointer Table (PDPT) containing 512 entries mapping to PDs.
 */
typedef struct pdpt {
    pt_entry_t entries[512];
} __attribute__((aligned(4096))) pdpt_t;

/**
 * The top level Page Map Level 4 (PML4) containing 512 entries mapping to PDPTs.
 * This is what gets loaded into the CR3 register!
 */
typedef struct pml4 {
    pt_entry_t entries[512];
} __attribute__((aligned(4096))) pml4_t;

// ----------------------------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------------------------

/**
 * @brief Initializes the VMM. Creates the initial kernel PML4 directory, 
 * identity maps the kernel image and hardware regions (VGA, APIC), and 
 * enables paging by loading CR3.
 */
void vmm_init();

/**
 * @brief Creates a completely new, blank virtual address space for a User Process.
 * The top half (kernel space) is cloned from the master kernel PML4.
 * @return Pointer to the physical address of the new PML4.
 */
pml4_t* vmm_create_address_space();

/**
 * @brief Switches the CPU to a new virtual address space (loads CR3).
 * @param pml4 Physical address of the PML4 structure.
 */
void vmm_switch_pml4(pml4_t* pml4);

/**
 * @brief Maps a physical address to a virtual address with specific flags.
 * If the intermediate tables (PDPT, PD, PT) don't exist, this function 
 * dynamically allocates them using the Buddy Allocator (pmm.c).
 * 
 * @param pml4 The address space to map within.
 * @param virt The virtual address.
 * @param phys The physical address (from alloc_page).
 * @param flags Protection flags (PAGE_PRESENT | PAGE_WRITE | PAGE_USER).
 */
void vmm_map_page(pml4_t* pml4, uint64_t virt, uint64_t phys, uint64_t flags);

/**
 * @brief Unmaps a virtual address, breaking the link to physical RAM.
 * @param pml4 The address space.
 * @param virt The virtual address to unmap.
 */
void vmm_unmap_page(pml4_t* pml4, uint64_t virt);

/**
 * @brief Translates a virtual address to a physical address.
 * @param pml4 The address space.
 * @param virt The virtual address.
 * @return The physical address, or 0 if not mapped.
 */
uint64_t vmm_get_phys(pml4_t* pml4, uint64_t virt);

// ----------------------------------------------------------------------------
// SMP & INTERRUPT API
// ----------------------------------------------------------------------------

/**
 * @brief Flushes a specific address from the local CPU's TLB.
 */
void vmm_flush_tlb(uint64_t virt);

/**
 * @brief SMP TLB Shootdown. 
 * Fires an APIC Inter-Processor Interrupt to force all other CPU cores to 
 * invalidate a specific virtual address from their TLB caches to prevent 
 * stale memory access.
 */
void vmm_tlb_shootdown(uint64_t virt);

/**
 * @brief The Page Fault Handler (INT 14).
 * Driven by the IDT. This function analyzes the CR2 register (which holds 
 * the faulting address) and the error code to determine if we need to 
 * perform Demand Paging, resolve a Copy-on-Write (CoW), or Segfault the app.
 */
void vmm_page_fault_handler(void* registers);

#endif // VMM_H
