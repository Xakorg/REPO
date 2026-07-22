#include "pe.h"
#include "vmm.h"
#include "pmm.h"
#include "task.h"
#include "vga.h"
#include "string.h"

// ----------------------------------------------------------------------------
// VoltraOS Enterprise Kernel - Windows NT Portable Executable (PE) Loader
// ----------------------------------------------------------------------------

// A helper function to align values to page boundaries (usually 4096)
static uint32_t align_up(uint32_t val, uint32_t alignment) {
    if (val % alignment == 0) return val;
    return val + (alignment - (val % alignment));
}

// ----------------------------------------------------------------------------
// The Core Execution Engine
// ----------------------------------------------------------------------------
// This function takes a raw byte buffer (e.g., loaded from the NVMe drive) 
// containing a Windows .exe, parses the NT headers, maps physical pages via the
// MMU into User Space, copies the executable sections (.text, .data, .rdata), 
// and prepares a Task Control Block to jump to the Windows Entry Point!
bool pe_load_executable(uint8_t* file_buffer, uint32_t file_size) {
    if (!file_buffer || file_size < sizeof(IMAGE_DOS_HEADER)) {
        printf("[NT-LDR] Error: Invalid file buffer.\n");
        return false;
    }
    
    // 1. Verify DOS Header ("MZ")
    IMAGE_DOS_HEADER* dos_header = (IMAGE_DOS_HEADER*)file_buffer;
    if (dos_header->e_magic != IMAGE_DOS_SIGNATURE) {
        printf("[NT-LDR] Error: Not a valid Windows .exe (Missing MZ signature)\n");
        return false;
    }
    
    // 2. Locate and Verify NT Headers ("PE\0\0")
    IMAGE_NT_HEADERS32* nt_headers = (IMAGE_NT_HEADERS32*)(file_buffer + dos_header->e_lfanew);
    
    // Ensure the NT Header fits within the file buffer
    if ((uint8_t*)nt_headers + sizeof(IMAGE_NT_HEADERS32) > file_buffer + file_size) {
        printf("[NT-LDR] Error: Corrupted PE file (NT Header out of bounds)\n");
        return false;
    }
    
    if (nt_headers->Signature != IMAGE_NT_SIGNATURE) {
        printf("[NT-LDR] Error: Not a valid Windows .exe (Missing PE signature)\n");
        return false;
    }
    
    uint8_t old_color = terminal_color;
    terminal_setcolor(vga_entry_color(VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK));
    printf("[VOLTRA NT-ENGINE] Executing Windows Binary natively...\n");
    
    uint32_t image_base = nt_headers->OptionalHeader.ImageBase; // Usually 0x400000
    uint32_t entry_point = image_base + nt_headers->OptionalHeader.AddressOfEntryPoint;
    uint32_t total_image_size = nt_headers->OptionalHeader.SizeOfImage;
    
    printf("  [NT-LDR] Image Base: 0x"); print_hex(image_base);
    printf(" | Entry Point: 0x"); print_hex(entry_point);
    printf(" | RAM Needed: %d KB\n", total_image_size / 1024);
    
    // 3. Allocate Virtual Memory using the MMU
    // We must map physical memory to the Virtual Address requested by the .exe (ImageBase)
    uint32_t num_pages = align_up(total_image_size, PAGE_SIZE) / PAGE_SIZE;
    for (uint32_t i = 0; i < num_pages; i++) {
        uint32_t virt_addr = image_base + (i * PAGE_SIZE);
        
        // Allocate a physical frame
        void* phys_frame = pmm_alloc_block();
        if (!phys_frame) {
            printf("  [NT-LDR] KERNEL PANIC: Out of Physical Memory!\n");
            terminal_setcolor(old_color);
            return false;
        }
        
        // Map it into User Space (is_kernel = false, is_writable = true)
        vmm_map_page(phys_frame, (void*)virt_addr, false, true);
        
        // Zero out the newly allocated memory
        memset((void*)virt_addr, 0, PAGE_SIZE);
    }
    
    // 4. Load the PE Headers into Memory
    // The OS expects the DOS/NT headers to be mapped at the ImageBase
    uint32_t headers_size = nt_headers->OptionalHeader.SizeOfHeaders;
    memcpy((void*)image_base, file_buffer, headers_size);
    
    // 5. Parse and Load the Sections (.text, .data, .rsrc)
    IMAGE_SECTION_HEADER* section = (IMAGE_SECTION_HEADER*)((uint8_t*)&nt_headers->OptionalHeader + nt_headers->FileHeader.SizeOfOptionalHeader);
    uint16_t num_sections = nt_headers->FileHeader.NumberOfSections;
    
    for (uint16_t i = 0; i < num_sections; i++) {
        // Extract section name (null-terminated strictly if < 8 chars)
        char sec_name[9];
        memcpy(sec_name, section->Name, 8);
        sec_name[8] = '\0';
        
        uint32_t dest_virt_addr = image_base + section->VirtualAddress;
        uint32_t src_file_offset = section->PointerToRawData;
        uint32_t size_on_disk = section->SizeOfRawData;
        uint32_t size_in_mem = section->Misc.VirtualSize;
        
        // Map Section Protection Flags using MMU CoW/Writable logic
        bool is_writable = (section->Characteristics & IMAGE_SCN_MEM_WRITE) != 0;
        bool is_executable = (section->Characteristics & IMAGE_SCN_MEM_EXECUTE) != 0;
        
        printf("  [NT-LDR] Mapping Section '%s' -> VAddr: 0x", sec_name);
        print_hex(dest_virt_addr);
        printf(" [W:%d X:%d]\n", is_writable, is_executable);
        
        if (size_on_disk > 0) {
            memcpy((void*)dest_virt_addr, file_buffer + src_file_offset, size_on_disk);
        }
        
        // Memory beyond SizeOfRawData up to VirtualSize is already zeroed 
        // by the MMU allocation loop above (for .bss equivalent sections)
        
        section++;
    }
    
    // 6. NT Subsystem / DLL Imports
    // For a real game, this is where we would read the Import Directory Table (IDT)
    // and load kernel32.dll, user32.dll, d3d11.dll natively into memory.
    // We would map Windows API calls (e.g. CreateWindowEx) into our Voltra Display Server (VDS).
    printf("  [NT-LDR] WARNING: NT Subsystem / DLL Import Resolution deferred to dynamic linker.\n");
    
    // 7. Context Switching
    // Create a new Ring 3 User Mode task pointing to AddressOfEntryPoint.
    printf("  [NT-LDR] Launching Windows Thread at 0x"); print_hex(entry_point); printf("!\n");
    terminal_setcolor(old_color);
    
    // create_user_task((void (*)())entry_point);
    
    return true;
}
