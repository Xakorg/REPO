#include "task.h"
#include "heap.h"

// External assembly context switch function
extern void perform_task_switch(uint32_t *current_esp, uint32_t next_esp);

volatile task_t* current_task = 0;
volatile task_t* ready_queue = 0;
static uint32_t next_pid = 1;

void tasking_init(void) {
    // We are currently running in the main kernel thread. Create a task block for it.
    current_task = (task_t*)kmalloc(sizeof(task_t));
    current_task->id = next_pid++;
    current_task->esp = 0;
    current_task->ebp = 0;
    current_task->next = (struct task*)current_task; // Circular linked list
    ready_queue = current_task;
}

void create_task(void (*entry_point)()) {
    task_t* new_task = (task_t*)kmalloc(sizeof(task_t));
    new_task->id = next_pid++;
    
    // Allocate a 4KB stack for the new thread
    uint32_t* stack = (uint32_t*)(kmalloc(4096) + 4096);
    
    // Simulate a stack that was interrupted by perform_task_switch()
    *--stack = (uint32_t)entry_point; // EIP (Return address)
    *--stack = 0; // EBP
    *--stack = 0; // EDI
    *--stack = 0; // ESI
    *--stack = 0; // EBX
    
    new_task->esp = (uint32_t)stack;
    new_task->ebp = 0;
    
    // Insert into circular queue
    new_task->next = ready_queue->next;
    ready_queue->next = new_task;
}

#include "elf.h"
#include "vga.h"

// Dynamically parses an ELF file and drops it into the Multitasking Scheduler!
void create_process_from_elf(uint8_t *buffer) {
    uint32_t entry_point = elf_load_buffer(buffer);
    if (entry_point != 0) {
        // We successfully extracted the Entry Point. Spawn the thread!
        create_task((void (*)())entry_point);
    } else {
        printf("[SCHEDULER] Failed to spawn process from ELF binary.\n");
    }
}

void task_yield(void) {
    if (!current_task || current_task->next == current_task) return; // Only 1 task running
    
    task_t* prev = (task_t*)current_task;
    current_task = current_task->next;
    
    // Switch CPU execution instantly!
    perform_task_switch(&prev->esp, current_task->esp);
}
