#ifndef TASK_H
#define TASK_H

#include <stdint.h>

typedef struct task {
    uint32_t id;
    uint32_t esp;       // The Stack Pointer for this thread
    uint32_t ebp;       // The Base Pointer
    struct task* next;  // Next task in the Round-Robin queue
} task_t;

void tasking_init(void);
void create_task(void (*entry_point)());
void create_process_from_elf(uint8_t *buffer);
void task_yield(void);

#endif
