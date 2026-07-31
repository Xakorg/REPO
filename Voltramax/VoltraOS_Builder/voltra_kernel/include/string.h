#ifndef STRING_H
#define STRING_H

#include <stddef.h>

void *memcpy(void *dest, const void *src, size_t n);
void *memset(void *s, int c, size_t n);
size_t strlen(const char* str);
char* strcpy(char* dest, const char* src);
void reverse(char str[], int length);
char* itoa(int num, char* str, int base);

#endif
