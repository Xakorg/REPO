#ifndef HEAP_H
#define HEAP_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

// A block header for our dynamic memory linked list
typedef struct heap_block {
    size_t size;
    bool is_free;
    struct heap_block* next;
    uint32_t magic; // Protection against heap corruption!
} heap_block_t;

#define HEAP_MAGIC 0x123890AB
#define HEAP_START_ADDRESS 0xC0000000 // Start the heap high up in Virtual Memory!

void heap_init(void);
void* kmalloc(size_t size);
void kfree(void* ptr);

#endif
