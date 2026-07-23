/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - SYMMETRIC MULTIPROCESSING (SMP)
 * ============================================================================
 * 
 * This file orchestrates the awakening of all CPU cores.
 * ============================================================================
 */

#include "smp.h"
#include "apic.h"
#include "pmm.h"
#include "vga.h"
#include "string.h"

cpu_core_t cpus[256];

// External symbols from smp_trampoline.s
extern uint32_t smp_trampoline_start;
extern uint32_t smp_trampoline_end;

// Pointer to where the BSP patches the dynamic Stack for the AP
// (Calculated as offset into the trampoline binary)
#define AP_STACK_PTR_OFFSET 0x40

// ----------------------------------------------------------------------------
// SPINLOCK IMPLEMENTATION
// ----------------------------------------------------------------------------

void spinlock_init(spinlock_t* lock) {
    lock->lock = 0;
}

void spinlock_acquire(spinlock_t* lock) {
    asm volatile(
        "1: \n\t"
        "lock btsl $0, %0 \n\t"
        "jc 1b \n\t"
        : "+m" (lock->lock)
        : 
        : "memory"
    );
}

void spinlock_release(spinlock_t* lock) {
    asm volatile("lock btrl $0, %0" : "+m" (lock->lock) :: "memory");
}

// ----------------------------------------------------------------------------
// CPU BOOTSTRAPPING
// ----------------------------------------------------------------------------

volatile uint32_t ap_boot_sync = 0;

void smp_init_all_cores() {
    // 1. Copy the 16-bit trampoline code to a safe low-memory address (e.g., 0x8000)
    uint32_t trampoline_addr = 0x8000;
    uint32_t trampoline_size = (uint32_t)&smp_trampoline_end - (uint32_t)&smp_trampoline_start;
    memcpy((void*)trampoline_addr, &smp_trampoline_start, trampoline_size);

    // Get the BSP's ID so we don't try to wake ourselves up
    uint32_t bsp_id = get_core_id();
    
    // Setup the BSP Core Struct
    cpus[bsp_id].apic_id = bsp_id;
    cpus[bsp_id].logic_id = 0;
    
    extern uint32_t smp_cpu_count;
    extern uint32_t smp_cpu_ids[];

    uint32_t current_logic_id = 1;

    for (uint32_t i = 0; i < smp_cpu_count; i++) {
        uint32_t ap_id = smp_cpu_ids[i];
        if (ap_id == bsp_id) continue;

        // Allocate a unique 4KB kernel stack for this new CPU core
        page_t* stack_page = alloc_page(ZONE_NORMAL);
        uint32_t stack_top = page_to_phys(stack_page) + PAGE_SIZE;

        // Patch the stack pointer into the trampoline code at 0x8000 + offset
        *((uint32_t*)(trampoline_addr + AP_STACK_PTR_OFFSET)) = stack_top;

        // Initialize Core Struct
        cpus[ap_id].apic_id = ap_id;
        cpus[ap_id].logic_id = current_logic_id++;

        // Reset sync flag
        ap_boot_sync = 0;

        // Send INIT-SIPI sequence to wake the AP.
        // The trampoline page is 0x8000 >> 12 = 0x08.
        lapic_send_init_sipi(ap_id, 0x08);

        // Wait for the AP to boot, switch to Protected Mode, and set the sync flag
        // In a real OS, there is a timeout here in case the core is dead.
        while (ap_boot_sync == 0) {
            asm volatile("pause");
        }
    }
}

// ----------------------------------------------------------------------------
// AP C ENTRY POINT
// ----------------------------------------------------------------------------

void smp_ap_main() {
    // We are now in 32-bit Protected Mode, executing C code on a secondary CPU core!
    uint32_t core_id = get_core_id();

    // 1. Initialize the Local APIC for this specific core
    lapic_init();

    // 2. Initialize the LAPIC Timer to drive this core's Scheduler instances
    lapic_timer_init(1000);

    // 3. Load the Global kernel PML4 to enable Virtual Memory for this core
    extern void* kernel_pml4;
    asm volatile("mov %0, %%cr3" :: "r"(kernel_pml4) : "memory");

    // 4. Signal the BSP that we are alive and well!
    ap_boot_sync = 1;

    // 5. Drop into the idle loop waiting for the CFS Scheduler to assign us a task
    while (1) {
        asm volatile("sti; hlt");
    }
}
