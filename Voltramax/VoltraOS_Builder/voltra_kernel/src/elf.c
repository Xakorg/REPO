/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - ELF EXECUTABLE LOADER IMPLEMENTATION
 * ============================================================================
 * 
 * This file handles parsing the ELF binary format, mapping the executable 
 * segments into isolated Virtual Memory, allocating the User Stack, and 
 * executing the Ring 0 to Ring 3 privilege drop.
 * ============================================================================
 */

#include "elf.h"
#include "vmm.h"
#include "pmm.h"
#include "heap.h"
#include "string.h"
#include "vga.h"

// ----------------------------------------------------------------------------
// INTERNAL HELPERS
// ----------------------------------------------------------------------------

/**
 * @brief Verifies the ELF Magic Number header.
 */
static bool is_valid_elf(elf32_ehdr_t* hdr) {
    return (hdr->e_ident[0] == ELFMAG0 &&
            hdr->e_ident[1] == ELFMAG1 &&
            hdr->e_ident[2] == ELFMAG2 &&
            hdr->e_ident[3] == ELFMAG3);
}

// ----------------------------------------------------------------------------
// CORE LOADER LOGIC
// ----------------------------------------------------------------------------

task_struct_t* elf_load_executable(const char* path) {
    // 1. Open the file via the VFS
    file_t* file = vfs_open(path, 0); // O_RDONLY
    if (!file) return NULL;
    
    // 2. Read the ELF Header
    elf32_ehdr_t ehdr;
    if (vfs_read(file, &ehdr, sizeof(elf32_ehdr_t)) != sizeof(elf32_ehdr_t)) {
        vfs_close(file);
        return NULL;
    }
    
    if (!is_valid_elf(&ehdr)) {
        vfs_close(file);
        return NULL;
    }
    
    // 3. Create a completely isolated Virtual Memory Space for this process
    pml4_t* process_pml4 = vmm_create_address_space();
    if (!process_pml4) {
        vfs_close(file);
        return NULL;
    }
    
    // 4. Parse the Program Headers (Segments)
    // We must seek to the Program Header Offset (e_phoff)
    file->offset = ehdr.e_phoff;
    
    for (int i = 0; i < ehdr.e_phnum; i++) {
        elf32_phdr_t phdr;
        if (vfs_read(file, &phdr, sizeof(elf32_phdr_t)) != sizeof(elf32_phdr_t)) break;
        
        // We only care about LOAD segments (Code, Data, BSS)
        if (phdr.p_type == PT_LOAD) {
            
            // Calculate how many 4KB physical pages we need
            uint32_t num_pages = (phdr.p_memsz + PAGE_SIZE - 1) / PAGE_SIZE;
            
            // Calculate virtual address alignment
            uint32_t virt_base = phdr.p_vaddr & ~(PAGE_SIZE - 1);
            uint32_t offset_in_page = phdr.p_vaddr & (PAGE_SIZE - 1);
            
            for (uint32_t p = 0; p < num_pages; p++) {
                // Allocate physical RAM
                page_t* phys_page = alloc_page(ZONE_NORMAL);
                uint32_t phys_addr = page_to_phys(phys_page);
                
                // Set memory protection flags based on ELF headers
                uint64_t vmm_flags = PAGE_PRESENT | PAGE_USER;
                if (phdr.p_flags & PF_W) vmm_flags |= PAGE_WRITE;
                if (!(phdr.p_flags & PF_X)) vmm_flags |= PAGE_NX;
                
                // Map the physical page into the process's PML4!
                vmm_map_page(process_pml4, virt_base + (p * PAGE_SIZE), phys_addr, vmm_flags);
                
                // If this is the first page of the segment, we must read the file data into it.
                // We have to temporarily map this physical memory into the KERNEL so we can copy to it.
                // For this stub, we simulate the copy.
                if (p == 0) {
                    // [STUB] 
                    // uint32_t bytes_to_read = phdr.p_filesz;
                    // uint64_t old_offset = file->offset;
                    // file->offset = phdr.p_offset;
                    // vfs_read(file, kernel_temp_mapping + offset_in_page, bytes_to_read);
                    // file->offset = old_offset;
                }
                
                // Handle the BSS section: If Memory Size > File Size, the remainder must be zeroed out.
                if (phdr.p_memsz > phdr.p_filesz) {
                    // [STUB] memset the remainder of the physical page to 0.
                }
            }
        }
    }
    
    // 5. Allocate a User Space Stack
    // Usually located near the top of the lower address space (e.g., 0xBFFFF000)
    uint32_t user_stack_virt = 0xBFFFF000;
    page_t* stack_page = alloc_page(ZONE_NORMAL);
    vmm_map_page(process_pml4, user_stack_virt, page_to_phys(stack_page), PAGE_PRESENT | PAGE_WRITE | PAGE_USER);
    
    // 6. Create the Task Control Block (TCB)
    // We pass a dummy entry_point because we will override the hardware context manually.
    task_struct_t* task = create_task(NULL);
    task->cr3 = process_pml4;
    
    // 7. Manually forge the Interrupt Return Stack Frame on the Kernel Stack!
    // When the CFS schedules this task, the context switch assembly will execute `iret`.
    // We must setup the stack so `iret` safely transitions us to Ring 3.
    
    uint32_t* stack = task->kernel_stack;
    
    *(--stack) = 0x23; // User Data Segment Selector (Ring 3)
    *(--stack) = user_stack_virt + PAGE_SIZE; // User Stack Pointer (Top of the page)
    *(--stack) = 0x0202; // EFLAGS (Interrupts enabled)
    *(--stack) = 0x1B; // User Code Segment Selector (Ring 3)
    *(--stack) = ehdr.e_entry; // EIP (The Entry Point from the ELF header!)
    
    // Push dummy general purpose registers
    for (int i = 0; i < 8; i++) *(--stack) = 0;
    
    task->kernel_stack = stack;
    
    vfs_close(file);
    return task;
}

// ----------------------------------------------------------------------------
// RING 3 TRANSITION
// ----------------------------------------------------------------------------

void switch_to_user_mode(uint32_t entry_point, uint32_t user_stack) {
    // This is a manual override function used if we aren't using the CFS stack forger.
    // It pushes the exact 5 values required by the `iret` instruction to jump to Ring 3.
    asm volatile(
        "mov $0x23, %%ax \n\t"  // User Data Segment (0x20 | 0x3 Ring 3 RPL)
        "mov %%ax, %%ds \n\t"
        "mov %%ax, %%es \n\t"
        "mov %%ax, %%fs \n\t"
        "mov %%ax, %%gs \n\t"
        
        "pushl $0x23 \n\t"      // SS
        "pushl %0 \n\t"         // ESP
        "pushf \n\t"            // EFLAGS
        "popl %%eax \n\t"
        "orl $0x200, %%eax \n\t" // Enable Interrupts in EFLAGS
        "pushl %%eax \n\t"      // EFLAGS back on stack
        "pushl $0x1B \n\t"      // CS (0x18 | 0x3 Ring 3 RPL)
        "pushl %1 \n\t"         // EIP
        "iret \n\t"             // Blastoff!
        :
        : "r"(user_stack), "r"(entry_point)
        : "memory", "eax"
    );
}
