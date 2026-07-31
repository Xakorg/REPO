#include "vga.h"
#include "ports.h"
#include "gdt.h"
#include "idt.h"
#include "isr.h"
#include "keyboard.h"
#include "pmm.h"
#include "vmm.h"
#include "heap.h"
#include "pci.h"
#include "timer.h"
#include "ata.h"
#include "vfs.h"
#include "fat32.h"
#include "multiboot.h"
#include "graphics.h"
#include "font.h"
#include "mouse.h"
#include "window.h"
#include "task.h"
#include "rtl8139.h"
#include "vds_compositor.h"
#include "ahci.h"
#include "nvme.h"

extern void switch_to_user_mode();
// A generic wrapper that triggers INT 0x80 to politely ask the Kernel to print!
void syscall_print(char* str, uint32_t x, uint32_t y, uint32_t color) {
    asm volatile("int $0x80" : : "a"(1), "b"(str), "c"(x), "d"(y), "S"(color));
}
// Thread A drops down into Ring 3 (User Mode)
void thread_A() {
    switch_to_user_mode(); 
    while(1) {
        syscall_print("[THREAD A]: Running in RING 3 USER MODE!", 120, 250, COLOR_GREEN);
    }
}

// Thread B stays in Ring 0 (Kernel Mode)
void thread_B() {
    while(1) {
        draw_string("[THREAD B]: Running in RING 0 KERNEL MODE!", 120, 270, COLOR_RED, COLOR_WHITE);
    }
}

void kernel_main(uint32_t magic, multiboot_info_t* mbd) {
    if (magic != 0x2BADB002) return;

    graphics_init(mbd);
    
    // --- XAKTEIR BOOT SCREEN ---
    uint32_t sw = get_screen_width();
    draw_xakteir_background(0);
    
    // "VOLTRAMAX" (9 chars, scaled 6x = 48px width per char)
    draw_string_scaled("VOLTRAMAX", (sw - (9 * 48))/2, 200, COLOR_WHITE, 0, 6);
    
    // "by xakteir" (10 chars, scaled 2x = 16px width per char)
    draw_string_scaled("by xakteir", (sw - (10 * 16))/2, 280, 0x00EEEEEE, 0, 2);
    
    uint32_t boot_y = 500;
    uint32_t boot_x = (sw - (25 * 16))/2; 
    draw_string_scaled("Booting OS ", boot_x, boot_y, COLOR_WHITE, 0, 2);
    boot_x += (11 * 16); 

    init_gdt();
    draw_string_scaled(".", boot_x, boot_y, COLOR_WHITE, 0, 2); boot_x += 16;
    
    init_idt();
    pic_remap();
    draw_string_scaled(".", boot_x, boot_y, COLOR_WHITE, 0, 2); boot_x += 16;
    
    pmm_init(512 * 1024, 0x100000, 0); 
    draw_string_scaled(".", boot_x, boot_y, COLOR_WHITE, 0, 2); boot_x += 16;
    
    vmm_init();
    draw_string_scaled(".", boot_x, boot_y, COLOR_WHITE, 0, 2); boot_x += 16;
    
    kmem_init();
    draw_string_scaled(".", boot_x, boot_y, COLOR_WHITE, 0, 2); boot_x += 16;
    
    init_timer(1000); 
    mouse_init(); 
    draw_string_scaled(".", boot_x, boot_y, COLOR_WHITE, 0, 2); boot_x += 16;
    
    // Register Storage Drivers
    ahci_init_driver();
    nvme_init_driver();
    
    // Enumerate PCI Bus and bind drivers
    pci_scan_bus();
    draw_string_scaled(".", boot_x, boot_y, COLOR_WHITE, 0, 2); boot_x += 16;
    
    rtl8139_init();
    draw_string_scaled(".", boot_x, boot_y, COLOR_WHITE, 0, 2); boot_x += 16;
    
    tasking_init();
    create_task(thread_A);
    create_task(thread_B);
    draw_string_scaled(".", boot_x, boot_y, COLOR_WHITE, 0, 2); boot_x += 16;
    
    if (ata_identify_device()) {
        fat32_init();
        inode_t* vfs_root = fat32_mount();
    } 
    draw_string_scaled(".", boot_x, boot_y, COLOR_WHITE, 0, 2); boot_x += 16;
    
    // Now animate the Xakteir colors for 15 seconds! (900 frames)
    for (uint32_t frame = 0; frame < 900; frame++) {
        draw_xakteir_background(frame);
        draw_string_scaled("VOLTRAMAX", (sw - (9 * 48))/2, 200, COLOR_WHITE, 0, 6);
        draw_string_scaled("by xakteir", (sw - (10 * 16))/2, 280, 0x00EEEEEE, 0, 2);
        draw_string_scaled("Booting OS . . . . . . . .", (sw - (26 * 16))/2, boot_y, COLOR_WHITE, 0, 2);
        
        // Artificial delay for ~60fps
        for(volatile int d=0; d<1000000; d++); 
    }
    
    // --- BOOT COMPLETE, LAUNCH DESKTOP ---
    vds_init(); 
    
    asm volatile("sti");

    while(1) {
        mouse_poll();
        vds_composite_frame();
    }
}
