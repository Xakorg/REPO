#include "mouse.h"
#include "ports.h"
#include "graphics.h"

static int32_t mouse_x = 512;
static int32_t mouse_y = 384;
static uint8_t mouse_buttons = 0;
static uint8_t mouse_cycle = 0;
static uint8_t mouse_packet[3];

void mouse_wait(uint8_t a_type) {
    uint32_t _time_out = 100000;
    if (a_type == 0) {
        while (_time_out--) if ((inb(0x64) & 1) == 1) return;
    } else {
        while (_time_out--) if ((inb(0x64) & 2) == 0) return;
    }
}

void mouse_write(uint8_t a_write) {
    mouse_wait(1);
    outb(0x64, 0xD4);
    mouse_wait(1);
    outb(0x60, a_write);
}

uint8_t mouse_read(void) {
    mouse_wait(0);
    return inb(0x60);
}

void mouse_init(void) {
    uint8_t _status;
    mouse_wait(1);
    outb(0x64, 0xA8); // Enable Auxiliary Device (Mouse)
    
    mouse_wait(1);
    outb(0x64, 0x20); 
    mouse_wait(0);
    _status = (inb(0x60) | 2); // Enable IRQ12 just in case
    
    mouse_wait(1);
    outb(0x64, 0x60); 
    mouse_wait(1);
    outb(0x60, _status);
    
    // Set defaults and enable
    mouse_write(0xF6);
    mouse_read();
    mouse_write(0xF4);
    mouse_read();
}

// Called continuously by the kernel loop to read hardware without IRQs
void mouse_poll(void) {
    uint8_t status = inb(0x64);
    if (!(status & 1)) return;    // No data in buffer
    if (!(status & 0x20)) return; // Data is not from mouse (it's keyboard)
    
    mouse_packet[mouse_cycle++] = inb(0x60);
    
    if (mouse_cycle == 3) {
        mouse_cycle = 0;
        
        uint8_t flags = mouse_packet[0];
        int32_t dx = mouse_packet[1];
        int32_t dy = mouse_packet[2];
        
        if (flags & (1 << 4)) dx |= 0xFFFFFF00; 
        if (flags & (1 << 5)) dy |= 0xFFFFFF00; 
        
        mouse_x += dx;
        mouse_y -= dy; // Y is inverted
        mouse_buttons = flags & 0x07;
        
        // Clamp to screen bounds
        if (mouse_x < 0) mouse_x = 0;
        if (mouse_y < 0) mouse_y = 0;
        if (mouse_x > (int32_t)get_screen_width() - 1) mouse_x = get_screen_width() - 1;
        if (mouse_y > (int32_t)get_screen_height() - 1) mouse_y = get_screen_height() - 1;
    }
}

int32_t get_mouse_x(void) { return mouse_x; }
int32_t get_mouse_y(void) { return mouse_y; }
uint8_t get_mouse_buttons(void) { return mouse_buttons; }
