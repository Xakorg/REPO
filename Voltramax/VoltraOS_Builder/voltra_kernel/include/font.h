#ifndef FONT_H
#define FONT_H

#include <stdint.h>

// A basic 8x8 pixel font array for ASCII characters 32 to 126
// Each character is 8 bytes. Each byte represents one horizontal row of 8 pixels.
// 1 = draw pixel, 0 = transparent.

extern const uint8_t font8x8_basic[95][8];

void draw_char(char c, uint32_t x, uint32_t y, uint32_t fg_color, uint32_t bg_color);
void draw_string(const char* str, uint32_t x, uint32_t y, uint32_t fg_color, uint32_t bg_color);

#endif
