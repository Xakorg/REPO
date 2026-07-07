#include "pmm.h"
#include "string.h"
#include "vga.h"

// The Bitmap that maps every single 4KB block of RAM in the system
static uint32_t* _pmm_bitmap = 0;
static size_t _pmm_max_blocks = 0;
static size_t _pmm_used_blocks = 0;

static inline void mmap_set(int bit) {
    _pmm_bitmap[bit / 32] |= (1 << (bit % 32));
}

static inline void mmap_unset(int bit) {
    _pmm_bitmap[bit / 32] &= ~(1 << (bit % 32));
}

static inline bool mmap_test(int bit) {
    return _pmm_bitmap[bit / 32] & (1 << (bit % 32));
}

static int mmap_first_free() {
    for (size_t i = 0; i < _pmm_max_blocks / 32; i++) {
        if (_pmm_bitmap[i] != 0xFFFFFFFF) {
            for (int j = 0; j < 32; j++) {
                int bit = 1 << j;
                if (!(_pmm_bitmap[i] & bit)) {
                    return i * 32 + j;
                }
            }
        }
    }
    return -1;
}

void pmm_init(size_t mem_size, uint32_t bitmap_addr) {
    _pmm_max_blocks = (mem_size * 1024) / PMM_BLOCK_SIZE;
    _pmm_used_blocks = _pmm_max_blocks; // Initially mark everything as used
    _pmm_bitmap = (uint32_t*) bitmap_addr;

    // Zero out the bitmap
    memset(_pmm_bitmap, 0xFF, _pmm_max_blocks / PMM_BLOCKS_PER_BYTE);
    
    uint8_t old_color = terminal_color;
    terminal_setcolor(vga_entry_color(VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK));
    printf("[VOLTRA KERNEL] Voltramax Physical Memory Manager (PMM) Initialized.\n");
    terminal_setcolor(old_color);
}

void pmm_init_region(uint32_t base, size_t size) {
    int align = base / PMM_BLOCK_SIZE;
    int blocks = size / PMM_BLOCK_SIZE;

    for (; blocks > 0; blocks--) {
        mmap_unset(align++);
        _pmm_used_blocks--;
    }
    mmap_set(0); // Protect the very first block (0x0)
}

void pmm_deinit_region(uint32_t base, size_t size) {
    int align = base / PMM_BLOCK_SIZE;
    int blocks = size / PMM_BLOCK_SIZE;

    for (; blocks > 0; blocks--) {
        mmap_set(align++);
        _pmm_used_blocks++;
    }
}

void* pmm_alloc_block() {
    if (pmm_get_free_blocks() <= 0) {
        // OUT OF MEMORY
        return 0; 
    }

    int frame = mmap_first_free();
    if (frame == -1) return 0; // Out of memory

    mmap_set(frame);
    _pmm_used_blocks++;
    
    uint32_t addr = frame * PMM_BLOCK_SIZE;
    return (void*)addr;
}

void pmm_free_block(void* p) {
    uint32_t addr = (uint32_t)p;
    int frame = addr / PMM_BLOCK_SIZE;
    mmap_unset(frame);
    _pmm_used_blocks--;
}

size_t pmm_get_memory_size() { return _pmm_max_blocks * PMM_BLOCK_SIZE; }
size_t pmm_get_used_blocks() { return _pmm_used_blocks; }
size_t pmm_get_free_blocks() { return _pmm_max_blocks - _pmm_used_blocks; }
