#include "window.h"
#include "graphics.h"
#include "font.h"
#include "mouse.h"

// Hardcoded standard UI cursor (12x16 pointer)
// 0 = transparent, 1 = black border, 2 = white body
static const uint8_t cursor_bitmap[16][12] = {
    {1,0,0,0,0,0,0,0,0,0,0,0},
    {1,1,0,0,0,0,0,0,0,0,0,0},
    {1,2,1,0,0,0,0,0,0,0,0,0},
    {1,2,2,1,0,0,0,0,0,0,0,0},
    {1,2,2,2,1,0,0,0,0,0,0,0},
    {1,2,2,2,2,1,0,0,0,0,0,0},
    {1,2,2,2,2,2,1,0,0,0,0,0},
    {1,2,2,2,2,2,2,1,0,0,0,0},
    {1,2,2,2,2,2,2,2,1,0,0,0},
    {1,2,2,2,2,2,2,2,2,1,0,0},
    {1,2,2,2,2,2,2,2,2,2,1,0},
    {1,2,2,2,2,2,1,1,1,1,1,1},
    {1,2,2,1,2,2,1,0,0,0,0,0},
    {1,2,1,0,1,2,2,1,0,0,0,0},
    {1,1,0,0,1,2,2,1,0,0,0,0},
    {1,0,0,0,0,1,1,0,0,0,0,0}
};

void wm_init(void) {
    // Window manager state initialization
}

void wm_draw_desktop(void) {
    uint32_t sw = get_screen_width();
    uint32_t sh = get_screen_height();
    
    // Draw the desktop background
    clear_screen(COLOR_DARK_GREY);
    
    // Draw the "Taskbar" at the bottom
    draw_rect(0, sh - 40, sw, 40, COLOR_BLACK);
    draw_string("VoltraOS Start", 10, sh - 25, COLOR_WHITE, 0);
    
    // Draw the main OS Window
    uint32_t win_x = 100;
    uint32_t win_y = 100;
    uint32_t win_w = sw - 200;
    uint32_t win_h = sh - 250;
    
    // Window Shadow & Body
    draw_rect(win_x + 5, win_y + 5, win_w, win_h, 0x00111111);
    draw_rect(win_x, win_y, win_w, win_h, COLOR_WHITE);
    
    // Window Title Bar
    draw_rect(win_x, win_y, win_w, 30, COLOR_VOLTRA_BLUE);
    
    // Window Close Button
    draw_rect(win_x + win_w - 40, win_y + 5, 20, 20, COLOR_RED);
    
    // Print Window Text
    draw_string("Voltramax Control Panel", win_x + 10, win_y + 10, COLOR_WHITE, COLOR_VOLTRA_BLUE);
    draw_string("Welcome to Voltramax Graphical Mode v0.7!", win_x + 20, win_y + 50, COLOR_BLACK, COLOR_WHITE);
    draw_string(">> MOUSE DRIVER: IRQ12 PS/2 ACTIVE", win_x + 20, win_y + 80, COLOR_BLACK, COLOR_WHITE);
    draw_string(">> WINDOW MANAGER: LIVE REDRAW ACTIVE", win_x + 20, win_y + 100, COLOR_BLACK, COLOR_WHITE);
}

void wm_draw_cursor(void) {
    int32_t mx = get_mouse_x();
    int32_t my = get_mouse_y();
    uint32_t sw = get_screen_width();
    uint32_t sh = get_screen_height();
    
    for (int y = 0; y < 16; y++) {
        for (int x = 0; x < 12; x++) {
            // Prevent drawing cursor out of physical memory bounds
            if (mx + x >= (int32_t)sw || my + y >= (int32_t)sh) continue;
            
            if (cursor_bitmap[y][x] == 1) {
                put_pixel(mx + x, my + y, COLOR_BLACK);
            } else if (cursor_bitmap[y][x] == 2) {
                put_pixel(mx + x, my + y, COLOR_WHITE);
            }
        }
    }
}

// Called in the infinite loop to redraw everything rapidly
void wm_update(void) {
    // In a real OS, you'd use double-buffering to prevent flickering.
    // For now, we will draw the desktop, and then instantly draw the cursor on top.
    wm_draw_desktop();
    wm_draw_cursor();
}
