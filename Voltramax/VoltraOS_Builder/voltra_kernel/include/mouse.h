#ifndef MOUSE_H
#define MOUSE_H

#include <stdint.h>

void mouse_init(void);
void mouse_poll(void);
int32_t get_mouse_x(void);
int32_t get_mouse_y(void);
uint8_t get_mouse_buttons(void);

#endif
