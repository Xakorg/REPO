#ifndef PMM_H
#define PMM_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#define PMM_BLOCK_SIZE 4096
#define PMM_BLOCKS_PER_BYTE 8

// Initialization of the Voltramax Physical Memory Manager
void pmm_init(size_t mem_size, uint32_t bitmap_addr);

// Mark memory regions as free or used
void pmm_init_region(uint32_t base, size_t size);
void pmm_deinit_region(uint32_t base, size_t size);

// Allocate and Free 4KB blocks of raw RAM
void* pmm_alloc_block(void);
void pmm_free_block(void* p);

// Statistics
size_t pmm_get_memory_size(void);
size_t pmm_get_used_blocks(void);
size_t pmm_get_free_blocks(void);

#endif
