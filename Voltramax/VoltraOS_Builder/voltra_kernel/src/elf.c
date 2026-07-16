#include "elf.h"
#include "string.h"
#include "heap.h"
#include "vga.h"

#define PT_LOAD 1

// Parses an ELF binary loaded into memory and extracts its executable code
uint32_t elf_load_buffer(uint8_t *buffer) {
    elf32_ehdr_t *header = (elf32_ehdr_t*)buffer;
    
    // 1. Verify the ELF Magic Signature
    uint32_t *magic = (uint32_t*)header->e_ident;
    if (*magic != ELF_MAGIC) {
        printf("[ELF LOADER] ERROR: Invalid ELF Magic Number!\n");
        return 0;
    }
    
    // 2. Verify Architecture (x86 = 3)
    if (header->e_machine != 3) {
        printf("[ELF LOADER] ERROR: Unsupported CPU Architecture! Expected x86.\n");
        return 0;
    }
    
    printf("[ELF LOADER] Parsing valid x86 ELF Binary...\n");
    
    // 3. Loop through all Program Headers looking for Loadable Segments
    elf32_phdr_t *phdrs = (elf32_phdr_t*)(buffer + header->e_phoff);
    for (uint16_t i = 0; i < header->e_phnum; i++) {
        if (phdrs[i].p_type == PT_LOAD) {
            
            // 4. Allocate raw physical RAM for the Segment
            uint8_t *segment_memory = (uint8_t*)kmalloc(phdrs[i].p_memsz);
            if (!segment_memory) {
                printf("[ELF LOADER] ERROR: Out of RAM while loading segment!\n");
                return 0;
            }
            
            // 5. Copy the compiled Machine Code into the allocated RAM!
            memcpy(segment_memory, buffer + phdrs[i].p_offset, phdrs[i].p_filesz);
            
            // 6. Zero-pad the .bss (Uninitialized Variables) section
            if (phdrs[i].p_memsz > phdrs[i].p_filesz) {
                memset(segment_memory + phdrs[i].p_filesz, 0, phdrs[i].p_memsz - phdrs[i].p_filesz);
            }
            
            // (Note: In Phase 11/12, we will use our Virtual Memory Manager (VMM) here 
            // to dynamically map `segment_memory` to the specific `phdrs[i].p_vaddr` requested by the app!)
        }
    }
    
    printf("[ELF LOADER] Binary loaded successfully! Entry Point: ");
    print_hex(header->e_entry);
    printf("\n");
    
    // 7. Return the Entry Point (The exact memory address where execution begins!)
    return header->e_entry;
}
