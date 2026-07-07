#include "vmm.h"
#include "pmm.h"
#include "vga.h"
#include "string.h"

// The current page directory loaded into the CPU
page_directory* _current_directory = 0;
// The master kernel page directory
page_directory* _kernel_directory = 0;

static inline void pt_entry_add_attrib(pt_entry* e, uint32_t attrib) { *e |= attrib; }
static inline void pt_entry_del_attrib(pt_entry* e, uint32_t attrib) { *e &= ~attrib; }
static inline void pt_entry_set_frame(pt_entry* e, uint32_t addr) { *e = (*e & ~0xFFFFF000) | addr; }
static inline bool pt_entry_is_present(pt_entry e) { return e & PTE_PRESENT; }

static inline void pd_entry_add_attrib(pd_entry* e, uint32_t attrib) { *e |= attrib; }
static inline void pd_entry_set_frame(pd_entry* e, uint32_t addr) { *e = (*e & ~0xFFFFF000) | addr; }

bool vmm_alloc_page(pt_entry *e) {
    void* p = pmm_alloc_block();
    if (!p) return false; // Out of physical memory!
    pt_entry_set_frame(e, (uint32_t)p);
    pt_entry_add_attrib(e, PTE_PRESENT);
    return true;
}

void vmm_free_page(pt_entry *e) {
    void* p = (void*)(*e & ~0xFFF);
    if (p) pmm_free_block(p);
    pt_entry_del_attrib(e, PTE_PRESENT);
}

pt_entry* vmm_ptable_lookup_entry(page_table *p, uint32_t addr) {
    if (p) return &p->m_entries[addr / PAGE_SIZE];
    return 0;
}

pd_entry* vmm_pdirectory_lookup_entry(page_directory *p, uint32_t addr) {
    if (p) return &p->m_entries[addr / (PAGE_SIZE * PAGES_PER_TABLE)];
    return 0;
}

bool vmm_switch_pdirectory(page_directory* dir) {
    if (!dir) return false;
    _current_directory = dir;
    asm volatile("mov %0, %%cr3":: "r"((uint32_t)dir));
    return true;
}

void vmm_enable_paging(bool enable) {
    uint32_t cr0;
    asm volatile("mov %%cr0, %0": "=r"(cr0));
    if (enable) cr0 |= 0x80000000;
    else cr0 &= ~0x80000000;
    asm volatile("mov %0, %%cr0":: "r"(cr0));
}

void vmm_map_page(void *phys, void *virt) {
    page_directory* dir = _kernel_directory;
    pd_entry* e = &dir->m_entries[(uint32_t)virt / (PAGE_SIZE * PAGES_PER_TABLE)];
    if ((*e & PTE_PRESENT) != PTE_PRESENT) {
        // Page table not present, allocate it
        page_table* table = (page_table*)pmm_alloc_block();
        if (!table) return;
        memset(table, 0, sizeof(page_table));
        pd_entry_add_attrib(e, PTE_PRESENT);
        pd_entry_add_attrib(e, PTE_READ_WRITE);
        pd_entry_set_frame(e, (uint32_t)table);
    }
    page_table* table = (page_table*)(*e & ~0xFFF);
    pt_entry* page = &table->m_entries[((uint32_t)virt % (PAGE_SIZE * PAGES_PER_TABLE)) / PAGE_SIZE];
    pt_entry_set_frame(page, (uint32_t)phys);
    pt_entry_add_attrib(page, PTE_PRESENT);
    pt_entry_add_attrib(page, PTE_READ_WRITE);
}

void vmm_init() {
    // Allocate a page directory from the PMM
    _kernel_directory = (page_directory*)pmm_alloc_block();
    if (!_kernel_directory) return;
    
    memset(_kernel_directory, 0, sizeof(page_directory));

    // Identity map the first 4MB so the kernel doesn't crash when paging is enabled
    page_table* table = (page_table*)pmm_alloc_block();
    memset(table, 0, sizeof(page_table));
    for (int i = 0, frame = 0, virt = 0; i < 1024; i++, frame += 4096, virt += 4096) {
        pt_entry page = 0;
        pt_entry_add_attrib(&page, PTE_PRESENT);
        pt_entry_add_attrib(&page, PTE_READ_WRITE);
        pt_entry_set_frame(&page, frame);
        table->m_entries[((uint32_t)virt % (PAGE_SIZE * PAGES_PER_TABLE)) / PAGE_SIZE] = page;
    }

    pd_entry* entry = &_kernel_directory->m_entries[0];
    pd_entry_add_attrib(entry, PTE_PRESENT);
    pd_entry_add_attrib(entry, PTE_READ_WRITE);
    pd_entry_set_frame(entry, (uint32_t)table);

    // Switch to our page directory and enable paging!
    vmm_switch_pdirectory(_kernel_directory);
    vmm_enable_paging(true);

    uint8_t old_color = terminal_color;
    terminal_setcolor(vga_entry_color(VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK));
    printf("[VOLTRA KERNEL] Voltramax Virtual Memory Manager (Paging) Enabled.\n");
    terminal_setcolor(old_color);
}
