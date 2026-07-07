#include "vga.h"
#include "ports.h"
#include "gdt.h"
#include "idt.h"
#include "isr.h"
#include "keyboard.h"
#include "pmm.h"
#include "vmm.h"
#include "heap.h"

void kernel_main(void) {
    // 1. Boot up the display
    terminal_initialize();
    
    // 2. Setup CPU Architecture (Segmentation & Interrupts)
    init_gdt();
    init_idt();
    pic_remap();
    
    // 3. Setup Voltramax Memory Subsystem
    // In a real GRUB boot, we get the memory map size from Multiboot.
    // For now, we assume 512MB of RAM, and put the Bitmap at 0x100000.
    pmm_init(512 * 1024, 0x100000); 
    
    // Enable Virtual Paging!
    vmm_init();
    
    // Boot the Kernel Heap!
    heap_init();
    
    // Enable Hardware Interrupts (STI)
    asm volatile("sti");

    // 4. Draw the UI!
    uint8_t ui_color = 0x1F; // Blue background, White text
    draw_ui_box(0, 0, 80, 25, ui_color, " VOLTRA OS LEGENDARY KERNEL v0.2 ");
    
    terminal_setcursor(2, 2);
    terminal_setcolor(0x0A); // Light green
    
    printf("\n>> CPU ARCHITECTURE: x86_64 Bare Metal Detected.\n");
    printf(">> PMM: "); print_hex(pmm_get_memory_size()); printf(" BYTES PHYSICAL RAM MANAGED.\n");
    printf(">> VMM: VIRTUAL PAGING ENABLED (CR3 LOADED).\n");
    printf(">> HEAP: DYNAMIC KERNEL ALLOCATION ONLINE.\n");
    printf(">> KEYBOARD DRIVER: LOADED ON PORT 0x60.\n");
    
    terminal_setcolor(0x0F); // White
    printf("\n  [ Welcome to VoltraOS. Total Hardware & Memory Control Achieved. ]\n");
    printf("  [ Try typing on your keyboard. The OS is listening... ]\n\n> ");
    
    // 5. The Infinite Kernel Loop
    while(1) {
        // Poll keyboard manually for our custom setup
        keyboard_handler_main();
    }
}
