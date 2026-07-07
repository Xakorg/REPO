#ifndef VMM_H
#define VMM_H

#include <stdint.h>
#include <stdbool.h>

#define PAGES_PER_TABLE 1024
#define PAGES_PER_DIR   1024
#define PAGE_SIZE       4096

// Page Table Entry (PTE) Flags
#define PTE_PRESENT       1
#define PTE_READ_WRITE    2
#define PTE_USER          4
#define PTE_WRITE_THROUGH 8
#define PTE_CACHE_DISABLE 16
#define PTE_ACCESSED      32
#define PTE_DIRTY         64

// Structure of a 32-bit Page Table Entry
typedef uint32_t pt_entry;

// Structure of a Page Table (1024 entries)
typedef struct {
    pt_entry m_entries[PAGES_PER_TABLE];
} page_table;

// Structure of a 32-bit Page Directory Entry
typedef uint32_t pd_entry;

// Structure of a Page Directory (1024 entries mapping to Page Tables)
typedef struct {
    pd_entry m_entries[PAGES_PER_DIR];
} page_directory;

void vmm_init(void);
bool vmm_alloc_page(pt_entry *e);
void vmm_free_page(pt_entry *e);
pt_entry* vmm_ptable_lookup_entry(page_table *p, uint32_t addr);
pd_entry* vmm_pdirectory_lookup_entry(page_directory *p, uint32_t addr);
bool vmm_switch_pdirectory(page_directory* dir);
void vmm_enable_paging(bool enable);
void vmm_map_page(void *phys, void *virt);

#endif
