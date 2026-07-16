#include "graphics.h"

// Internal state of the screen
static uint32_t* framebuffer = 0;
static uint32_t screen_width = 0;
static uint32_t screen_height = 0;
static uint32_t screen_pitch = 0;
static uint8_t screen_bpp = 0;

void graphics_init(multiboot_info_t* mbd) {
    // Check if GRUB actually gave us a VESA Framebuffer
    if (mbd->flags & (1 << 11)) { // VBE info flag
        // The framebuffer is a massive array of pixels mapped in physical memory!
        framebuffer = (uint32_t*)(uint32_t)mbd->framebuffer_addr;
        screen_width = mbd->framebuffer_width;
        screen_height = mbd->framebuffer_height;
        screen_pitch = mbd->framebuffer_pitch;
        screen_bpp = mbd->framebuffer_bpp;
    }
}

void put_pixel(uint32_t x, uint32_t y, uint32_t color) {
    if (x >= screen_width || y >= screen_height || !framebuffer) return;
    
    // Calculate the exact memory offset. 
    // Pitch is the number of bytes in one horizontal line.
    // We divide by 4 because framebuffer is a uint32_t pointer (4 bytes per pixel).
    uint32_t offset = (y * (screen_pitch / 4)) + x;
    framebuffer[offset] = color;
}

void draw_rect(uint32_t x, uint32_t y, uint32_t width, uint32_t height, uint32_t color) {
    for (uint32_t i = 0; i < height; i++) {
        for (uint32_t j = 0; j < width; j++) {
            put_pixel(x + j, y + i, color);
        }
    }
}

void clear_screen(uint32_t color) {
    draw_rect(0, 0, screen_width, screen_height, color);
}

void draw_gradient(uint32_t color_top, uint32_t color_bottom) {
    uint8_t r1 = (color_top >> 16) & 0xFF;
    uint8_t g1 = (color_top >> 8) & 0xFF;
    uint8_t b1 = color_top & 0xFF;
    
    uint8_t r2 = (color_bottom >> 16) & 0xFF;
    uint8_t g2 = (color_bottom >> 8) & 0xFF;
    uint8_t b2 = color_bottom & 0xFF;

    for (uint32_t y = 0; y < screen_height; y++) {
        uint8_t r = r1 + ((r2 - r1) * y) / screen_height;
        uint8_t g = g1 + ((g2 - g1) * y) / screen_height;
        uint8_t b = b1 + ((b2 - b1) * y) / screen_height;
        uint32_t row_color = (r << 16) | (g << 8) | b;
        
        for (uint32_t x = 0; x < screen_width; x++) {
            put_pixel(x, y, row_color);
        }
    }
}

static uint32_t screen_colors[4096];

static void rgb_to_hsv(uint8_t r, uint8_t g, uint8_t b, int32_t *h, int32_t *s, int32_t *v) {
    uint8_t min = r < g ? (r < b ? r : b) : (g < b ? g : b);
    uint8_t max = r > g ? (r > b ? r : b) : (g > b ? g : b);
    *v = max;
    int32_t delta = max - min;
    if (delta == 0) {
        *s = 0;
        *h = 0;
        return;
    }
    *s = (delta * 255) / max;
    int32_t hh;
    if (r == max) {
        hh = ((int32_t)g - (int32_t)b) * 60 / delta;
    } else if (g == max) {
        hh = 120 + ((int32_t)b - (int32_t)r) * 60 / delta;
    } else {
        hh = 240 + ((int32_t)r - (int32_t)g) * 60 / delta;
    }
    if (hh < 0) hh += 360;
    *h = hh;
}

static void hsv_to_rgb(int32_t h, int32_t s, int32_t v, uint8_t *r, uint8_t *g, uint8_t *b) {
    if (s == 0) {
        *r = *g = *b = v;
        return;
    }
    int32_t hh = h % 360;
    if (hh < 0) hh += 360;
    int32_t region = hh / 60;
    int32_t remainder = (hh - (region * 60)) * 255 / 60; 

    int32_t p = (v * (255 - s)) >> 8;
    int32_t q = (v * (255 - ((s * remainder) >> 8))) >> 8;
    int32_t t = (v * (255 - ((s * (255 - remainder)) >> 8))) >> 8;

    switch(region) {
        case 0: *r = v; *g = t; *b = p; break;
        case 1: *r = q; *g = v; *b = p; break;
        case 2: *r = p; *g = v; *b = t; break;
        case 3: *r = p; *g = q; *b = v; break;
        case 4: *r = t; *g = p; *b = v; break;
        default: *r = v; *g = p; *b = q; break;
    }
}

void draw_xakteir_background(uint32_t frame) {
    uint32_t colors[5] = {0x00E5FF, 0x00FF88, 0xFFCC00, 0xFF3366, 0x9900FF};
    
    uint32_t max_xy = screen_width + screen_height;
    if (max_xy > 4000) max_xy = 4000;
    
    uint32_t virtual_size = max_xy * 4;
    uint32_t segment_size = virtual_size / 4; 
    
    uint32_t pan_cycle = frame % 720;
    uint32_t pan_progress; 
    if (pan_cycle < 360) {
        pan_progress = (pan_cycle * 1000) / 360;
    } else {
        pan_progress = ((720 - pan_cycle) * 1000) / 360;
    }
    
    if (pan_progress < 500) {
        pan_progress = (2 * pan_progress * pan_progress) / 1000;
    } else {
        uint32_t inv = 1000 - pan_progress;
        pan_progress = 1000 - ((2 * inv * inv) / 1000);
    }
    uint32_t max_offset = virtual_size - max_xy;
    uint32_t pan_offset = (pan_progress * max_offset) / 1000;
    
    int32_t hue_shift = ((frame % 480) * 360) / 480;
    
    for (uint32_t i = 0; i < max_xy; i++) {
        uint32_t pos = i + pan_offset;
        uint32_t seg = pos / segment_size;
        if (seg >= 4) seg = 3;
        uint32_t pos_in_seg = pos % segment_size;
        
        uint32_t c1 = colors[seg];
        uint32_t c2 = colors[seg+1];
        
        int32_t r1 = (c1 >> 16) & 0xFF;
        int32_t g1 = (c1 >> 8) & 0xFF;
        int32_t b1 = c1 & 0xFF;
        int32_t r2 = (c2 >> 16) & 0xFF;
        int32_t g2 = (c2 >> 8) & 0xFF;
        int32_t b2 = c2 & 0xFF;
        
        uint8_t r = r1 + ((r2 - r1) * (int32_t)pos_in_seg) / (int32_t)segment_size;
        uint8_t g = g1 + ((g2 - g1) * (int32_t)pos_in_seg) / (int32_t)segment_size;
        uint8_t b = b1 + ((b2 - b1) * (int32_t)pos_in_seg) / (int32_t)segment_size;
        
        int32_t h, s, v;
        rgb_to_hsv(r, g, b, &h, &s, &v);
        h = (h + hue_shift) % 360;
        hsv_to_rgb(h, s, v, &r, &g, &b);
        
        screen_colors[i] = (r << 16) | (g << 8) | b;
    }
    
    for (uint32_t y = 0; y < screen_height; y++) {
        uint32_t byte_offset = y * (screen_pitch / 4);
        for (uint32_t x = 0; x < screen_width; x++) {
            uint32_t idx = x + y;
            if (idx >= 4000) idx = 3999;
            framebuffer[byte_offset + x] = screen_colors[idx];
        }
    }
}

uint32_t get_screen_width(void) {
    return screen_width;
}

uint32_t get_screen_height(void) {
    return screen_height;
}
