#include "syscall.h"
#include "graphics.h"
#include "font.h"

// The Master System Call Dispatcher!
// Apps in Ring 3 can trigger INT 0x80. The CPU halts the app, jumps to Ring 0, and runs this.
void syscall_handler(registers_t *regs) {
    if (regs->eax == 1) { 
        // SYSCALL 1: sys_print
        char* str = (char*)regs->ebx;
        uint32_t x = regs->ecx;
        uint32_t y = regs->edx;
        uint32_t color = regs->esi;
        
        // The Kernel draws the text on behalf of the application!
        draw_string(str, x, y, color, 0); 
    }
}
