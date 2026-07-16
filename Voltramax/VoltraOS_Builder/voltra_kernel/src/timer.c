#include "timer.h"
#include "ports.h"
#include "task.h"
#include "isr.h"

uint32_t tick = 0;

void timer_callback(registers_t *regs) {
    (void)regs;
    tick++;
    
    // Every 50 milliseconds, force a Preemptive Context Switch!
    if (tick % 50 == 0) {
        task_yield();
    }
}

void init_timer(uint32_t frequency) {
    uint32_t divisor = 1193180 / frequency;
    outb(0x43, 0x36);
    uint8_t l = (uint8_t)(divisor & 0xFF);
    uint8_t h = (uint8_t)((divisor >> 8) & 0xFF);
    outb(0x40, l);
    outb(0x40, h);
}
