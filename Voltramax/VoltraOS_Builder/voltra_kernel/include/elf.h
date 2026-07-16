#ifndef ELF_H
#define ELF_H

#include <stdint.h>

// 0x7F 'E' 'L' 'F' in Little Endian
#define ELF_MAGIC 0x464C457F 

// The ELF File Header (Tells us the Architecture and Entry Point)
typedef struct {
    uint8_t  e_ident[16];
    uint16_t e_type;
    uint16_t e_machine;
    uint32_t e_version;
    uint32_t e_entry;      // Virtual memory address where the code starts!
    uint32_t e_phoff;      // Program header table file offset
    uint32_t e_shoff;
    uint32_t e_flags;
    uint16_t e_ehsize;
    uint16_t e_phentsize;
    uint16_t e_phnum;      // Number of Program Headers
    uint16_t e_shentsize;
    uint16_t e_shnum;
    uint16_t e_shstrndx;
} __attribute__((packed)) elf32_ehdr_t;

// The ELF Program Header (Tells us which chunks of the file contain Code/Data)
typedef struct {
    uint32_t p_type;       // 1 = PT_LOAD (Loadable Segment)
    uint32_t p_offset;     // Offset of segment within the file
    uint32_t p_vaddr;      // Virtual memory address to map it to
    uint32_t p_paddr;
    uint32_t p_filesz;     // Size of the data in the file
    uint32_t p_memsz;      // Size of the data in memory (can be larger for uninitialized .bss)
    uint32_t p_flags;
    uint32_t p_align;
} __attribute__((packed)) elf32_phdr_t;

uint32_t elf_load_buffer(uint8_t *buffer);

#endif
