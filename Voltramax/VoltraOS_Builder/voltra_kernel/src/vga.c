#include "vga.h"
#include "ports.h"
#include "string.h"

static const size_t VGA_WIDTH = 80;
static const size_t VGA_HEIGHT = 25;
uint16_t* terminal_buffer;
size_t terminal_row;
size_t terminal_column;
uint8_t terminal_color;

static inline uint8_t vga_entry_color(enum vga_color fg, enum vga_color bg) { return fg | bg << 4; }
static inline uint16_t vga_entry(unsigned char uc, uint8_t color) { return (uint16_t) uc | (uint16_t) color << 8; }

void terminal_setcursor(int x, int y) {
    uint16_t pos = y * VGA_WIDTH + x;
    outb(0x3D4, 0x0F);
    outb(0x3D5, (uint8_t) (pos & 0xFF));
    outb(0x3D4, 0x0E);
    outb(0x3D5, (uint8_t) ((pos >> 8) & 0xFF));
}

void terminal_scroll() {
    for (size_t y = 1; y < VGA_HEIGHT; y++) {
        for (size_t x = 0; x < VGA_WIDTH; x++) {
            terminal_buffer[(y - 1) * VGA_WIDTH + x] = terminal_buffer[y * VGA_WIDTH + x];
        }
    }
    for (size_t x = 0; x < VGA_WIDTH; x++) {
        terminal_buffer[(VGA_HEIGHT - 1) * VGA_WIDTH + x] = vga_entry(' ', terminal_color);
    }
    terminal_row--;
}

void terminal_initialize(void) {
    terminal_row = 0;
    terminal_column = 0;
    terminal_color = vga_entry_color(VGA_COLOR_LIGHT_GREY, VGA_COLOR_BLACK);
    terminal_buffer = (uint16_t*) 0xB8000;
    for (size_t y = 0; y < VGA_HEIGHT; y++) {
        for (size_t x = 0; x < VGA_WIDTH; x++) {
            terminal_buffer[y * VGA_WIDTH + x] = vga_entry(' ', terminal_color);
        }
    }
}

void terminal_setcolor(uint8_t color) { terminal_color = color; }

void terminal_putentryat(char c, uint8_t color, size_t x, size_t y) {
    const size_t index = y * VGA_WIDTH + x;
    terminal_buffer[index] = vga_entry(c, color);
}

void terminal_putchar(char c) {
    if (c == '\n') {
        terminal_column = 0;
        if (++terminal_row == VGA_HEIGHT) terminal_scroll();
        terminal_setcursor(terminal_column, terminal_row);
        return;
    }
    terminal_putentryat(c, terminal_color, terminal_column, terminal_row);
    if (++terminal_column == VGA_WIDTH) {
        terminal_column = 0;
        if (++terminal_row == VGA_HEIGHT) terminal_scroll();
    }
    terminal_setcursor(terminal_column, terminal_row);
}

void terminal_write(const char* data, size_t size) {
    for (size_t i = 0; i < size; i++) terminal_putchar(data[i]);
}

void printf(const char* data) {
    terminal_write(data, strlen(data));
}

void print_hex(uint32_t num) {
    char hex_chars[] = "0123456789ABCDEF";
    char buffer[11];
    buffer[0] = '0'; buffer[1] = 'x';
    for (int i = 7; i >= 0; i--) {
        buffer[i + 2] = hex_chars[num & 0xF];
        num >>= 4;
    }
    buffer[10] = '\0';
    printf(buffer);
}

void draw_ui_box(size_t x, size_t y, size_t width, size_t height, uint8_t color, const char* title) {
    for (size_t i = x + 1; i < x + width - 1; i++) {
        terminal_putentryat(205, color, i, y);
        terminal_putentryat(205, color, i, y + height - 1);
    }
    for (size_t i = y + 1; i < y + height - 1; i++) {
        terminal_putentryat(186, color, x, i);
        terminal_putentryat(186, color, x + width - 1, i);
    }
    terminal_putentryat(201, color, x, y);
    terminal_putentryat(187, color, x + width - 1, y);
    terminal_putentryat(200, color, x, y + height - 1);
    terminal_putentryat(188, color, x + width - 1, y + height - 1);
    
    size_t title_len = strlen(title);
    size_t title_x = x + (width - title_len) / 2;
    for(size_t i = 0; i < title_len; i++) {
        terminal_putentryat(title[i], vga_entry_color(VGA_COLOR_WHITE, VGA_COLOR_BLUE), title_x + i, y);
    }
}
