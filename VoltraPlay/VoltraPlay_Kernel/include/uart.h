#ifndef UART_H
#define UART_H

#include <stdint.h>

/* Initialize the UART serial port */
void uart_init(void);

/* Send a single character over the serial port */
void uart_putc(char c);

/* Send a string over the serial port */
void uart_puts(const char* str);

#endif
