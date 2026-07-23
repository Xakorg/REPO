/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - COMPLETELY FAIR SCHEDULER (CFS)
 * ============================================================================
 * 
 * DESCRIPTION:
 * The traditional Round-Robin scheduler provides fixed time-slices, which 
 * causes jitter for desktop UI rendering and audio processing. 
 * VoltraOS implements a Completely Fair Scheduler (CFS) modeled after Linux.
 * 
 * CORE CONCEPTS:
 * 1. Virtual Runtime (vruntime): Instead of tracking how much time a task 
 *    HAS left, we track how much time it HAS RUN. 
 * 2. The Runqueue (Red-Black Tree): Tasks are inserted into a self-balancing
 *    tree sorted by vruntime. The scheduler always picks the leftmost node 
 *    (the task that has run the least amount of time). This ensures absolute 
 *    mathematical fairness.
 * 3. Weights (Nice values): Important tasks (like the Desktop Compositor) 
 *    have their vruntime artificially slowed down, meaning they stay on the 
 *    left side of the tree longer and receive exponentially more CPU time 
 *    than background tasks.
 * 
 * SMP ARCHITECTURE:
 * Every CPU Core has its OWN independent CFS Runqueue. This prevents 
 * global lock contention. Load-balancing algorithms periodically steal 
 * tasks from busy cores to idle cores.
 * ============================================================================
 */

#ifndef TASK_H
#define TASK_H

#include <stdint.h>
#include <stdbool.h>
#include "smp.h"

// Task States
#define TASK_RUNNABLE 0
#define TASK_SLEEPING 1
#define TASK_ZOMBIE   2

// ----------------------------------------------------------------------------
// STRUCTURES
// ----------------------------------------------------------------------------

/**
 * CPU Registers saved during a context switch.
 */
typedef struct registers {
    uint32_t edi, esi, ebp, esp, ebx, edx, ecx, eax; // Pushed by pusha
    uint32_t eip, cs, eflags, useresp, ss;           // Pushed by the processor automatically
} registers_t;

/**
 * The Task Control Block (TCB).
 */
typedef struct task_struct {
    uint32_t pid;
    uint32_t state;
    uint32_t *kernel_stack;
    
    // CFS Scheduling Metrics
    uint64_t vruntime;      // Virtual runtime (sorted key)
    uint64_t exec_start;    // Timestamp when task last got the CPU
    uint64_t sum_exec_runtime;
    uint32_t weight;        // Priority multiplier (Nice value)
    
    // Tree/List pointers for the Runqueue
    struct task_struct* left;
    struct task_struct* right;
    struct task_struct* parent;
    bool is_red;
    
    // Virtual Memory Space (PML4)
    void* cr3;
} task_struct_t;

/**
 * The CFS Runqueue (One per CPU Core).
 */
typedef struct cfs_rq {
    task_struct_t* root;        // Root of the Red-Black tree
    task_struct_t* leftmost;    // Cached pointer to the task with lowest vruntime
    uint32_t nr_running;        // Number of active tasks
    uint64_t min_vruntime;      // Floor value to prevent vruntime starvation for new tasks
    
    spinlock_t lock;            // SMP Spinlock protecting this runqueue
} cfs_rq_t;

// ----------------------------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------------------------

/**
 * @brief Initializes the CFS Scheduler subsystem.
 */
void tasking_init();

/**
 * @brief Creates a new kernel task and inserts it into the current core's Runqueue.
 * @param entry_point The C function address.
 * @return Pointer to the new task control block.
 */
task_struct_t* create_task(void (*entry_point)());

/**
 * @brief The Core CFS Scheduling function.
 * Called by the APIC Timer Interrupt on every CPU Core. It calculates the 
 * time delta, updates the current task's vruntime, and if another task has 
 * a lower vruntime, it triggers an assembly context switch.
 */
void schedule();

/**
 * @brief Voluntarily yields the CPU.
 */
void yield();

#endif // TASK_H
