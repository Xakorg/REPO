#include "isr.h"
#include "vga.h"
#include "string.h"

// Array of custom error messages mapped to the CPU exception codes!
char *exception_messages[] = {
    "Division By Zero Exception",
    "Debug Exception",
    "Non Maskable Interrupt Exception",
    "Breakpoint Exception",
    "Into Detected Overflow Exception",
    "Out of Bounds Exception",
    "Invalid Opcode Exception",
    "No Coprocessor Exception",
    "Double Fault Exception",
    "Coprocessor Segment Overrun Exception",
    "Bad TSS Exception",
    "Segment Not Present Exception",
    "Stack Fault Exception",
    "General Protection Fault Exception",
    "Page Fault Exception",
    "Unknown Interrupt Exception",
    "Coprocessor Fault Exception",
    "Alignment Check Exception (486+)",
    "Machine Check Exception (Pentium/586+)",
    "Reserved",
    "Reserved",
    "Reserved",
    "Reserved",
    "Reserved",
    "Reserved",
    "Reserved",
    "Reserved",
    "Reserved",
    "Reserved",
    "Reserved",
    "Reserved",
    "Reserved"
};

// This gets called directly from the Assembly interrupt.s file!
void isr_handler(registers_t regs) {
    terminal_setcolor(vga_entry_color(VGA_COLOR_WHITE, VGA_COLOR_RED)); // Red Screen of Death!
    printf("\n[!!! FATAL KERNEL PANIC !!!]\n");
    printf(">> CPU EXCEPTION TRIGGERED: ");
    
    if (regs.int_no < 32) {
        printf(exception_messages[regs.int_no]);
        printf("\n");
    } else {
        printf("UNKNOWN EXCEPTION\n");
    }
    
    printf(">> ERROR CODE: "); print_hex(regs.err_code); printf("\n");
    printf(">> HALTING SYSTEM TO PROTECT HARDWARE.\n");

    // Freeze the computer forever.
    while(1) {
        asm volatile("hlt");
    }
}
