#include "uart.h"

/* 
 * The base address for the PL011 UART on QEMU's ARM64 'virt' machine.
 * This is how we talk to the terminal from bare metal!
 */
#define UART0_BASE 0x09000000

/* Hardware registers for the UART */
#define UART0_DR   (*((volatile uint32_t *)(UART0_BASE + 0x00))) // Data Register
#define UART0_FR   (*((volatile uint32_t *)(UART0_BASE + 0x18))) // Flag Register

/* Flag masks */
#define UART_FR_TXFF (1 << 5) // Transmit FIFO full

void uart_init(void) {
    // For QEMU virt, the UART is already initialized by the emulator,
    // but on real hardware, we would configure baud rate and line control here.
}

void uart_putc(char c) {
    // Wait until the transmit FIFO has space
    while (UART0_FR & UART_FR_TXFF) {
        // Spin/wait
    }
    
    // Write the character to the data register
    UART0_DR = c;
}

void uart_puts(const char* str) {
    while (*str) {
        // Convert Unix newlines to Windows/Serial newlines
        if (*str == '\n') {
            uart_putc('\r');
        }
        uart_putc(*str++);
    }
}
