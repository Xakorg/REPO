#include "ata.h"
#include "ports.h"
#include "vga.h"

// Wait until the drive is ready to send/receive data
static void ata_wait(void) {
    for (int i = 0; i < 4; i++) {
        inb(ATA_PRIMARY_DCR_AS); // Read Alternate Status to cause delay
    }
    while ((inb(ATA_PRIMARY_IO + 7) & 0x80) == 0x80); // Wait until BSY clears
}

bool ata_identify_device(void) {
    // Select master drive
    outb(ATA_PRIMARY_IO + 6, 0xA0); 
    
    // Send 0 to sector count and LBA ports
    outb(ATA_PRIMARY_IO + 2, 0);
    outb(ATA_PRIMARY_IO + 3, 0);
    outb(ATA_PRIMARY_IO + 4, 0);
    outb(ATA_PRIMARY_IO + 5, 0);
    
    // Send IDENTIFY command
    outb(ATA_PRIMARY_IO + 7, ATA_CMD_IDENTIFY);
    
    // Check if device exists
    uint8_t status = inb(ATA_PRIMARY_IO + 7);
    if (status == 0 || status == 0xFF) return false; // No drive or floating bus
    
    ata_wait();
    
    // Read 256 16-bit values from data port
    uint16_t identify_data[256];
    for (int i = 0; i < 256; i++) {
        identify_data[i] = inw(ATA_PRIMARY_IO);
    }
    (void)identify_data; // Suppress unused warning
    
    uint8_t old_color = terminal_color;
    terminal_setcolor(vga_entry_color(VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK));
    printf("[VOLTRA KERNEL] Hardware ATA Disk Drive Detected.\n");
    terminal_setcolor(old_color);
    
    return true;
}

void ata_read_sector(uint32_t lba, uint8_t *buffer) {
    ata_wait();
    
    // Send LBA and Drive selection
    outb(ATA_PRIMARY_IO + 6, 0xE0 | ((lba >> 24) & 0x0F));
    outb(ATA_PRIMARY_IO + 2, 1); // Read 1 sector
    outb(ATA_PRIMARY_IO + 3, (uint8_t) lba);
    outb(ATA_PRIMARY_IO + 4, (uint8_t)(lba >> 8));
    outb(ATA_PRIMARY_IO + 5, (uint8_t)(lba >> 16));
    
    // Send Read Command
    outb(ATA_PRIMARY_IO + 7, ATA_CMD_READ_PIO);
    
    ata_wait();
    
    // Read the 512 bytes (256 16-bit words)
    for (int i = 0; i < 256; i++) {
        uint8_t low = inb(ATA_PRIMARY_IO);
        uint8_t high = inb(ATA_PRIMARY_IO);
        buffer[i * 2] = low;
        buffer[i * 2 + 1] = high;
    }
}

void ata_write_sector(uint32_t lba, uint8_t *buffer) {
    ata_wait();
    
    outb(ATA_PRIMARY_IO + 6, 0xE0 | ((lba >> 24) & 0x0F));
    outb(ATA_PRIMARY_IO + 2, 1);
    outb(ATA_PRIMARY_IO + 3, (uint8_t) lba);
    outb(ATA_PRIMARY_IO + 4, (uint8_t)(lba >> 8));
    outb(ATA_PRIMARY_IO + 5, (uint8_t)(lba >> 16));
    
    outb(ATA_PRIMARY_IO + 7, ATA_CMD_WRITE_PIO);
    
    ata_wait();
    
    for (int i = 0; i < 256; i++) {
        outb(ATA_PRIMARY_IO, buffer[i * 2]);
        // NOTE: Standard outb is 8-bit, for real hardware we need outw (16-bit).
        // Since we only have outb, we'll send it byte-by-byte (which works in emulation)
        outb(ATA_PRIMARY_IO, buffer[i * 2 + 1]); 
    }
    
    // Cache flush
    outb(ATA_PRIMARY_IO + 7, 0xE7);
    ata_wait();
}
