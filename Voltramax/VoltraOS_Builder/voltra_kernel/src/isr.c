#include "isr.h"
#include "vga.h"
#include "string.h"
#include "ports.h"

// Defined in timer.c & syscall.c
extern void timer_callback(registers_t *regs);
extern void syscall_handler(registers_t *regs);

char *exception_messages[] = {
    "Division By Zero", "Debug", "Non Maskable Interrupt", "Breakpoint", "Overflow",
    "Out of Bounds", "Invalid Opcode", "No Coprocessor", "Double Fault",
    "Coprocessor Segment Overrun", "Bad TSS", "Segment Not Present",
    "Stack Fault", "General Protection Fault", "Page Fault", "Unknown Interrupt",
    "Coprocessor Fault", "Alignment Check", "Machine Check",
    "Reserved","Reserved","Reserved","Reserved","Reserved","Reserved",
    "Reserved","Reserved","Reserved","Reserved","Reserved","Reserved","Reserved"
};

void isr_handler(registers_t regs) {
    if (regs.int_no == 128) {
        syscall_handler(&regs);
        return;
    }

    if (regs.int_no >= 32) {
        // Hardware IRQ Received!
        if (regs.int_no == 32) {
            timer_callback(&regs);
        }
        
        // Acknowledge the PIC Hardware
        if (regs.int_no >= 40) outb(0xA0, 0x20); // Slave
        outb(0x20, 0x20); // Master
        return; // Return back to executing code! Do not panic!
    }

    // Otherwise, it is a CPU Exception!
    terminal_setcolor(vga_entry_color(VGA_COLOR_WHITE, VGA_COLOR_RED)); // Red Screen of Death
    printf("\n[!!! FATAL KERNEL PANIC !!!]\n");
    printf(">> EXCEPTION: ");
    if (regs.int_no < 32) printf(exception_messages[regs.int_no]);
    printf("\n");
    
    printf(">> REGISTER DUMP:\n");
    printf("   EIP (Instruction Pointer): 0x"); print_hex(regs.eip);
    printf("   EAX: 0x"); print_hex(regs.eax);
    printf("\n   EBX: 0x"); print_hex(regs.ebx);
    printf("   ECX: 0x"); print_hex(regs.ecx);
    printf("\n   EDX: 0x"); print_hex(regs.edx);
    printf("   ESP: 0x"); print_hex(regs.esp);
    printf("\n   EBP: 0x"); print_hex(regs.ebp);
    
    printf("\n>> KERNEL HALTED TO PROTECT HARDWARE.\n");
    while(1) { asm volatile("hlt"); }
}
