#include "heap.h"
#include "vmm.h"
#include "pmm.h"
#include "vga.h"
#include "string.h"

static heap_block_t* head = NULL;

void heap_init() {
    // Map the first page of our heap into virtual memory
    void* phys = pmm_alloc_block();
    if (!phys) return; // PANIC!
    
    vmm_map_page(phys, (void*)HEAP_START_ADDRESS);
    
    head = (heap_block_t*)HEAP_START_ADDRESS;
    head->size = PAGE_SIZE - sizeof(heap_block_t);
    head->is_free = true;
    head->next = NULL;
    head->magic = HEAP_MAGIC;
    
    uint8_t old_color = terminal_color;
    terminal_setcolor(vga_entry_color(VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK));
    printf("[VOLTRA KERNEL] Voltramax Dynamic Kernel Heap (kmalloc) Initialized.\n");
    terminal_setcolor(old_color);
}

void* kmalloc(size_t size) {
    if (!size) return NULL;
    
    heap_block_t* curr = head;
    while (curr) {
        if (curr->magic != HEAP_MAGIC) {
            // HEAP CORRUPTION DETECTED
            return NULL;
        }
        if (curr->is_free && curr->size >= size) {
            // We found a block big enough!
            
            // Can we split it?
            if (curr->size > size + sizeof(heap_block_t) + 4) {
                heap_block_t* new_block = (heap_block_t*)((uint8_t*)curr + sizeof(heap_block_t) + size);
                new_block->is_free = true;
                new_block->size = curr->size - size - sizeof(heap_block_t);
                new_block->next = curr->next;
                new_block->magic = HEAP_MAGIC;
                
                curr->next = new_block;
                curr->size = size;
            }
            
            curr->is_free = false;
            return (void*)((uint8_t*)curr + sizeof(heap_block_t));
        }
        curr = curr->next;
    }
    
    // Out of heap memory! (In a real OS, we would ask VMM for more pages here)
    return NULL;
}

void kfree(void* ptr) {
    if (!ptr) return;
    
    heap_block_t* block = (heap_block_t*)((uint8_t*)ptr - sizeof(heap_block_t));
    if (block->magic != HEAP_MAGIC) {
        // HEAP CORRUPTION DETECTED on free!
        return;
    }
    
    block->is_free = true;
    
    // Coalesce adjacent free blocks to prevent fragmentation
    heap_block_t* curr = head;
    while (curr && curr->next) {
        if (curr->is_free && curr->next->is_free) {
            curr->size += curr->next->size + sizeof(heap_block_t);
            curr->next = curr->next->next;
        } else {
            curr = curr->next;
        }
    }
}
