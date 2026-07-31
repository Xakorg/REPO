/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - VIRTUAL MEMORY MANAGER IMPLEMENTATION
 * ============================================================================
 * 
 * This file implements Hardware Paging and Address Space Isolation.
 * 
 * ADDRESS TRANSLATION ARCHITECTURE (x86_64 4-Level Paging):
 * When a CPU tries to read a 64-bit Virtual Address, the MMU splits it:
 * - Bits 39-47: Index into the PML4 Table
 * - Bits 30-38: Index into the PDPT Table
 * - Bits 21-29: Index into the PD Table
 * - Bits 12-20: Index into the PT Table
 * - Bits 0-11:  Offset into the final 4KB Physical Page
 * 
 * If at any point the hardware reads an entry that lacks the PAGE_PRESENT flag,
 * it immediately halts execution and throws Exception 14 (Page Fault). 
 * 
 * SMP SAFETY (TLB SHOOTDOWNS):
 * Paging tables are heavily cached inside the CPU in the TLB (Translation 
 * Lookaside Buffer). If we unmap a page, we MUST manually tell the CPU to 
 * invalidate that cache using the `invlpg` assembly instruction. In a multi-core
 * system, we must interrupt the OTHER cores and force them to do the same!
 * ============================================================================
 */

#include "vmm.h"
#include "pmm.h"
#include "string.h"
#include "vga.h"    // For kernel panic

// The master Kernel PML4. All user processes clone the top half of this.
pml4_t* kernel_pml4 = NULL;

// ----------------------------------------------------------------------------
// UTILITY MACROS
// ----------------------------------------------------------------------------
#define PML4_INDEX(a) (((a) >> 39) & 0x1FF)
#define PDPT_INDEX(a) (((a) >> 30) & 0x1FF)
#define PD_INDEX(a)   (((a) >> 21) & 0x1FF)
#define PT_INDEX(a)   (((a) >> 12) & 0x1FF)

// Extract physical address from a table entry (stripping the lower 12 flag bits)
#define GET_PHYS_ADDR(entry) ((entry) & ~0xFFFULL)

// ----------------------------------------------------------------------------
// HARDWARE REGISTERS
// ----------------------------------------------------------------------------
static inline void load_cr3(uint64_t phys_addr) {
    asm volatile("mov %0, %%cr3" :: "r"((uint32_t)phys_addr) : "memory");
}

static inline uint64_t read_cr2() {
    uint32_t val;
    asm volatile("mov %%cr2, %0" : "=r"(val));
    return val;
}

void vmm_flush_tlb(uint64_t virt) {
    asm volatile("invlpg (%0)" :: "r"((uint32_t)virt) : "memory");
}

void vmm_tlb_shootdown(uint64_t virt) {
    // In a full SMP implementation, this writes to the Local APIC ICR register
    // to trigger an Inter-Processor Interrupt (IPI) vector on other cores.
    // The other cores receive the interrupt, call vmm_flush_tlb, and return.
    // [STUB]: APIC logic will be built in the SMP module.
}

// ----------------------------------------------------------------------------
// CORE MAPPING LOGIC
// ----------------------------------------------------------------------------

void vmm_map_page(pml4_t* pml4, uint64_t virt, uint64_t phys, uint64_t flags) {
    // 1. Traverse PML4 -> PDPT
    uint64_t pml4_idx = PML4_INDEX(virt);
    if (!(pml4->entries[pml4_idx] & PAGE_PRESENT)) {
        // Table doesn't exist! Ask the Buddy Allocator for a physical page.
        page_t* p = alloc_page(ZONE_NORMAL);
        uint64_t pdpt_phys = page_to_phys(p);
        
        // We must clear the memory to avoid interpreting garbage as active mappings
        memset((void*)pdpt_phys, 0, PAGE_SIZE); 
        
        // Link it in the PML4 (Always grant USER/WRITE at higher levels, restrict at PT)
        pml4->entries[pml4_idx] = pdpt_phys | PAGE_PRESENT | PAGE_WRITE | PAGE_USER;
    }
    pdpt_t* pdpt = (pdpt_t*)GET_PHYS_ADDR(pml4->entries[pml4_idx]);

    // 2. Traverse PDPT -> PD
    uint64_t pdpt_idx = PDPT_INDEX(virt);
    if (!(pdpt->entries[pdpt_idx] & PAGE_PRESENT)) {
        page_t* p = alloc_page(ZONE_NORMAL);
        uint64_t pd_phys = page_to_phys(p);
        memset((void*)pd_phys, 0, PAGE_SIZE);
        pdpt->entries[pdpt_idx] = pd_phys | PAGE_PRESENT | PAGE_WRITE | PAGE_USER;
    }
    page_directory_t* pd = (page_directory_t*)GET_PHYS_ADDR(pdpt->entries[pdpt_idx]);

    // 3. Traverse PD -> PT
    uint64_t pd_idx = PD_INDEX(virt);
    if (!(pd->entries[pd_idx] & PAGE_PRESENT)) {
        page_t* p = alloc_page(ZONE_NORMAL);
        uint64_t pt_phys = page_to_phys(p);
        memset((void*)pt_phys, 0, PAGE_SIZE);
        pd->entries[pd_idx] = pt_phys | PAGE_PRESENT | PAGE_WRITE | PAGE_USER;
    }
    page_table_t* pt = (page_table_t*)GET_PHYS_ADDR(pd->entries[pd_idx]);

    // 4. Finally, set the Page Table Entry to the target physical frame!
    uint64_t pt_idx = PT_INDEX(virt);
    pt->entries[pt_idx] = (phys & ~0xFFFULL) | flags | PAGE_PRESENT;
    
    // Invalidate the local CPU cache for this virtual address
    vmm_flush_tlb(virt);
}

void vmm_unmap_page(pml4_t* pml4, uint64_t virt) {
    uint64_t pml4_idx = PML4_INDEX(virt);
    if (!(pml4->entries[pml4_idx] & PAGE_PRESENT)) return;
    pdpt_t* pdpt = (pdpt_t*)GET_PHYS_ADDR(pml4->entries[pml4_idx]);

    uint64_t pdpt_idx = PDPT_INDEX(virt);
    if (!(pdpt->entries[pdpt_idx] & PAGE_PRESENT)) return;
    page_directory_t* pd = (page_directory_t*)GET_PHYS_ADDR(pdpt->entries[pdpt_idx]);

    uint64_t pd_idx = PD_INDEX(virt);
    if (!(pd->entries[pd_idx] & PAGE_PRESENT)) return;
    page_table_t* pt = (page_table_t*)GET_PHYS_ADDR(pd->entries[pd_idx]);

    uint64_t pt_idx = PT_INDEX(virt);
    
    // Clear the Present bit
    pt->entries[pt_idx] &= ~PAGE_PRESENT;
    
    // Invalidate cache across all CPU cores
    vmm_flush_tlb(virt);
    vmm_tlb_shootdown(virt);
}

// ----------------------------------------------------------------------------
// ADDRESS SPACE MANAGEMENT
// ----------------------------------------------------------------------------

pml4_t* vmm_create_address_space() {
    page_t* p = alloc_page(ZONE_NORMAL);
    pml4_t* new_pml4 = (pml4_t*)page_to_phys(p);
    
    // Clear lower half (User Space)
    memset(new_pml4, 0, PAGE_SIZE);
    
    // Clone upper half (Kernel Space, entries 256-511) from master kernel PML4
    // This ensures every user application shares the exact same kernel memory mappings,
    // but the PAGE_USER flag is deliberately omitted so Ring 3 apps segfault if they 
    // try to read/write to the kernel half.
    for (int i = 256; i < 512; i++) {
        new_pml4->entries[i] = kernel_pml4->entries[i];
    }
    
    return new_pml4;
}

void vmm_switch_pml4(pml4_t* pml4) {
    load_cr3((uint64_t)pml4);
}

// ----------------------------------------------------------------------------
// PAGE FAULT HANDLER (Demand Paging & Copy-on-Write)
// ----------------------------------------------------------------------------

void vmm_page_fault_handler(void* registers) {
    (void)registers;
    // registers is a struct pushed by the IDT containing CPU state and the Error Code
    uint64_t faulting_address = read_cr2();
    uint32_t err_code = 0; // [STUB] Extracted from registers struct
    
    bool present = err_code & 0x1;
    bool rw      = err_code & 0x2;
    bool user    = err_code & 0x4;
    
    // SCENARIO 1: Copy-on-Write (CoW) Resolution
    // If a page is marked present, but we got a Write fault, it might be CoW!
    if (present && rw) {
        // Traverse to PT to check custom PAGE_COW flag
        // [STUB] If PAGE_COW is set:
        // 1. alloc_page() to get a fresh frame.
        // 2. memcpy() the contents from the old read-only frame to the new frame.
        // 3. Update the PT entry to point to the new frame with PAGE_WRITE enabled.
        // 4. vmm_flush_tlb().
        // 5. Return from interrupt! The CPU will transparently retry the write instruction.
        return;
    }
    
    // SCENARIO 2: Demand Paging (Lazy Loading)
    // If the program is trying to access unmapped heap or stack memory within 
    // valid boundaries, we map a fresh physical frame dynamically!
    if (!present && user) {
        // [STUB] Check if faulting_address falls within valid VMA (Virtual Memory Area) blocks
        // If valid:
        // page_t* p = alloc_page(ZONE_NORMAL);
        // vmm_map_page(current_pml4, faulting_address, page_to_phys(p), PAGE_PRESENT | PAGE_WRITE | PAGE_USER);
        // return;
    }
    
    // SCENARIO 3: Segmentation Fault
    // The application tried to access memory it shouldn't (e.g., dereferencing NULL pointer).
    // In an Enterprise OS, we don't kernel panic. We kill the faulting task!
    // kill_task(current_task, SIGSEGV);
}
