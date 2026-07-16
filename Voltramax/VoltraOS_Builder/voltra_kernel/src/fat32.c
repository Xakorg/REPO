#include "fat32.h"
#include "ata.h"
#include "heap.h"
#include "string.h"
#include "vga.h"

fat32_bpb_t bpb;
uint32_t fat_start_lba;
uint32_t data_start_lba;

void fat32_init() {
    uint8_t boot_sector[512];
    
    // Read the very first sector of the hard drive!
    ata_read_sector(0, boot_sector);
    
    // Copy the raw magnetic bytes into our beautiful C structure
    memcpy(&bpb, boot_sector, sizeof(fat32_bpb_t));
    
    // Calculate where the File Allocation Table actually starts on the disk
    fat_start_lba = bpb.reserved_sectors;
    
    // Calculate where the actual files and folders are stored
    data_start_lba = fat_start_lba + (bpb.fat_count * bpb.sectors_per_fat_32);
    
    uint8_t old_color = terminal_color;
    terminal_setcolor(vga_entry_color(VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK));
    printf("[VOLTRA KERNEL] FAT32 File System Decoder Initialized.\n");
    terminal_setcolor(vga_entry_color(VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK));
    printf("  [FAT32] Volume Label: ");
    
    // Print the Volume Label (up to 11 characters)
    for(int i=0; i<11; i++) {
        if(bpb.volume_label[i] >= 32 && bpb.volume_label[i] <= 126)
            terminal_putchar(bpb.volume_label[i]);
    }
    printf("\n");
    
    terminal_setcolor(old_color);
}

// In a real implementation, this would read the Root Directory clusters.
// For now, we mock the mount point for the VFS.
vfs_node_t* fat32_mount() {
    vfs_node_t* root = (vfs_node_t*)kmalloc(sizeof(vfs_node_t));
    if (!root) return NULL;
    
    memset(root, 0, sizeof(vfs_node_t));
    
    // Name the root folder "/"
    root->name[0] = '/';
    root->name[1] = '\0';
    
    root->flags = FS_DIRECTORY;
    root->inode = bpb.root_cluster;
    
    // Link the FAT32 algorithm to the Virtual File System!
    // (Here we would link root->readdir = fat32_readdir, etc.)
    
    return root;
}
