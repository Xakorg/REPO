#ifndef GRAPHICS_H
#define GRAPHICS_H

#include <stdint.h>
#include "multiboot.h"

// Define some standard ARGB Hex Colors
#define COLOR_BLACK       0x00000000
#define COLOR_WHITE       0x00FFFFFF
#define COLOR_RED         0x00FF0000
#define COLOR_GREEN       0x0000FF00
#define COLOR_BLUE        0x000000FF
#define COLOR_VOLTRA_BLUE 0x001E90FF
#define COLOR_DARK_GREY   0x00333333

// Initialize the graphics engine using the Multiboot Info from GRUB
void graphics_init(multiboot_info_t* mbd);

// The core pixel drawing function
void put_pixel(uint32_t x, uint32_t y, uint32_t color);

// High-level drawing functions
void draw_rect(uint32_t x, uint32_t y, uint32_t width, uint32_t height, uint32_t color);
void clear_screen(uint32_t color);
void draw_gradient(uint32_t color_top, uint32_t color_bottom);
void draw_xakteir_background(uint32_t offset);

// Getters for screen dimensions
uint32_t get_screen_width(void);
uint32_t get_screen_height(void);

// Include font headers here for convenience
void draw_char(char c, uint32_t x, uint32_t y, uint32_t fg_color, uint32_t bg_color);
void draw_string(const char* str, uint32_t x, uint32_t y, uint32_t fg_color, uint32_t bg_color);
void draw_char_scaled(char c, uint32_t x, uint32_t y, uint32_t fg_color, uint32_t bg_color, uint32_t scale);
void draw_string_scaled(const char* str, uint32_t x, uint32_t y, uint32_t fg_color, uint32_t bg_color, uint32_t scale);

#endif
