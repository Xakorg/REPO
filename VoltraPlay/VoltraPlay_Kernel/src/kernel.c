#include "uart.h"

/* 
 * kmain is the absolute entry point of our C code.
 * We arrive here from boot.S after the CPU is configured for 64-bit mode.
 */
void kmain(void) {
    // 1. Initialize the Serial Debugger
    uart_init();
    
    // 2. Print our very first bare-metal text!
    uart_puts("\n");
    uart_puts("=======================================\n");
    uart_puts("    VOLTRAPLAY ARM64 KERNEL BOOTING    \n");
    uart_puts("=======================================\n");
    uart_puts("[OK] UART Serial Driver Initialized.\n");
    uart_puts("[OK] Dropped into 64-bit Execution Level 1.\n");
    
    uart_puts("\n[SYS] Halting CPU. Waiting for Phase 2...\n");
    
    // 3. Hang the kernel indefinitely
    while (1) {
        // An empty infinite loop to keep the OS alive
        __asm__ volatile ("wfe"); // Wait For Event (saves power)
    }
}
