/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - SYMMETRIC MULTIPROCESSING (SMP)
 * ============================================================================
 * 
 * DESCRIPTION:
 * Handles the bootstrapping of secondary CPU cores (Application Processors),
 * multi-core synchronization primitives (Spinlocks), and CPU-local data.
 * ============================================================================
 */

#ifndef SMP_H
#define SMP_H

#include <stdint.h>
#include <stdbool.h>

// ----------------------------------------------------------------------------
// SYNCHRONIZATION PRIMITIVES
// ----------------------------------------------------------------------------

/**
 * A basic ticket or simple atomic spinlock.
 */
typedef struct spinlock {
    volatile uint32_t lock;
} spinlock_t;

void spinlock_init(spinlock_t* lock);
void spinlock_acquire(spinlock_t* lock);
void spinlock_release(spinlock_t* lock);

// ----------------------------------------------------------------------------
// CPU LOCAL DATA
// ----------------------------------------------------------------------------

/**
 * struct cpu_core: Maintains state for a specific logical CPU core.
 * In a true OS, the GS segment register is pointed to this struct 
 * so that the kernel can always read `current_task` for the local core.
 */
typedef struct cpu_core {
    uint32_t apic_id;
    uint32_t logic_id;
    struct task_struct* current_task;
    struct task_struct* idle_task;
    uint32_t tlb_flush_pending;
} cpu_core_t;

// Max 256 logical cores supported
extern cpu_core_t cpus[256];

// ----------------------------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------------------------

/**
 * @brief Bootstraps all Application Processors discovered via the ACPI MADT.
 * Copies the 16-bit trampoline code to low memory and sends the INIT-SIPI sequence.
 */
void smp_init_all_cores();

/**
 * @brief The C entry point for a newly awakened Application Processor (AP).
 * Called directly by the 16-bit to 32-bit assembly trampoline in `smp_trampoline.s`.
 */
void smp_ap_main();

#endif // SMP_H
