#ifndef GDT_H
#define GDT_H

#include <stdint.h>

struct gdt_entry_struct {
    uint16_t limit_low;
    uint16_t base_low;
    uint8_t  base_middle;
    uint8_t  access;
    uint8_t  granularity;
    uint8_t  base_high;
} __attribute__((packed));

struct gdt_ptr_struct {
    uint16_t limit;
    uint32_t base;
} __attribute__((packed));

struct tss_entry_struct {
   uint32_t prev_tss;
   uint32_t esp0, ss0, esp1, ss1, esp2, ss2;
   uint32_t cr3, eip, eflags, eax, ecx, edx, ebx, esp, ebp, esi, edi;
   uint32_t es, cs, ss, ds, fs, gs;
   uint32_t ldt;
   uint16_t trap, iomap_base;
} __attribute__((packed));
extern void tss_flush(void);

void init_gdt(void);

#endif
