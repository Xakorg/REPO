#ifndef SYSCALL_H
#define SYSCALL_H

#include <stdint.h>
#include "isr.h"

void syscall_handler(registers_t *regs);

#endif
