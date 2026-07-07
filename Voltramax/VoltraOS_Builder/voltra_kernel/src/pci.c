#include "pci.h"
#include "ports.h"
#include "vga.h"
#include "string.h"

uint16_t pci_read_word(uint8_t bus, uint8_t slot, uint8_t func, uint8_t offset) {
    uint32_t address;
    uint32_t lbus  = (uint32_t)bus;
    uint32_t lslot = (uint32_t)slot;
    uint32_t lfunc = (uint32_t)func;
    
    // Create configuration address
    address = (uint32_t)((lbus << 16) | (lslot << 11) | (lfunc << 8) | (offset & 0xfc) | ((uint32_t)0x80000000));
    
    // Write out the address
    outb(PCI_CONFIG_ADDRESS, address >> 24);
    outb(PCI_CONFIG_ADDRESS + 1, address >> 16);
    outb(PCI_CONFIG_ADDRESS + 2, address >> 8);
    outb(PCI_CONFIG_ADDRESS + 3, address);
    
    // Read in the data (PCI is 32-bit, so we shift based on offset)
    uint8_t low = inb(PCI_CONFIG_DATA + (offset & 2));
    uint8_t high = inb(PCI_CONFIG_DATA + (offset & 2) + 1);
    
    return ((uint16_t)high << 8) | low;
}

uint16_t pci_get_vendor_id(uint8_t bus, uint8_t slot, uint8_t func) {
    return pci_read_word(bus, slot, func, 0); // Vendor ID is at offset 0
}

uint16_t pci_get_device_id(uint8_t bus, uint8_t slot, uint8_t func) {
    return pci_read_word(bus, slot, func, 2); // Device ID is at offset 2
}

void pci_scan_bus() {
    uint8_t old_color = terminal_color;
    terminal_setcolor(vga_entry_color(VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK));
    printf("[VOLTRA KERNEL] Scanning Voltramax PCI Bus for Hardware...\n");
    terminal_setcolor(vga_entry_color(VGA_COLOR_LIGHT_CYAN, VGA_COLOR_BLACK));

    int devices_found = 0;
    for (uint32_t bus = 0; bus < 256; bus++) {
        for (uint32_t slot = 0; slot < 32; slot++) {
            for (uint32_t func = 0; func < 8; func++) {
                uint16_t vendor = pci_get_vendor_id(bus, slot, func);
                if (vendor == 0xFFFF) continue; // 0xFFFF means no device plugged in
                
                uint16_t device = pci_get_device_id(bus, slot, func);
                printf("  [PCI] Detected Hardware at Bus "); 
                print_hex(bus); printf(" | Vendor ID: "); print_hex(vendor);
                printf(" | Device ID: "); print_hex(device); printf("\n");
                
                devices_found++;
            }
        }
    }
    
    terminal_setcolor(vga_entry_color(VGA_COLOR_LIGHT_GREEN, VGA_COLOR_BLACK));
    printf("[VOLTRA KERNEL] PCI Scan Complete. ");
    char buf[10];
    itoa(devices_found, buf, 10);
    printf(buf);
    printf(" Devices Connected to Motherboard.\n");
    terminal_setcolor(old_color);
}
