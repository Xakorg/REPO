#include "rtl8139.h"
#include "ports.h"
#include "pci.h"
#include "vga.h"
#include "heap.h"

// Hardware specific PCI helpers to prevent corrupting PCI config space layout
uint32_t pci_read_dword_local(uint8_t bus, uint8_t slot, uint8_t func, uint8_t offset) {
    uint32_t address = (uint32_t)((bus << 16) | (slot << 11) | (func << 8) | (offset & 0xFC) | 0x80000000);
    outl(0xCF8, address);
    return inl(0xCFC);
}

void pci_write_word_local(uint8_t bus, uint8_t slot, uint8_t func, uint8_t offset, uint16_t value) {
    uint32_t address = (uint32_t)((bus << 16) | (slot << 11) | (func << 8) | (offset & 0xFC) | 0x80000000);
    outl(0xCF8, address);
    outw(0xCFC + (offset & 2), value);
}

void rtl8139_init(void) {
    uint8_t target_bus = 0;
    uint8_t target_slot = 0;
    uint8_t found = 0;
    
    // 1. Scan PCI Bus for Realtek RTL8139 (Vendor 0x10EC, Device 0x8139)
    for (uint16_t bus = 0; bus < 256; bus++) {
        for (uint8_t slot = 0; slot < 32; slot++) {
            if (pci_get_vendor_id(bus, slot, 0) == 0x10EC && pci_get_device_id(bus, slot, 0) == 0x8139) {
                target_bus = bus;
                target_slot = slot;
                found = 1;
                break;
            }
        }
        if (found) break;
    }
    
    if (!found) {
        printf("[NETWORK] RTL8139 Network Card NOT FOUND on PCI Bus.\n");
        return;
    }
    
    printf("[NETWORK] RTL8139 Network Card Detected! (Bus 0x");
    print_hex(target_bus);
    printf(", Slot 0x");
    print_hex(target_slot);
    printf(")\n");
    
    // 2. Read Base I/O Address (BAR0) from the PCI Header
    uint32_t bar0 = pci_read_dword_local(target_bus, target_slot, 0, 0x10);
    uint32_t io_base = bar0 & ~3; // Drop the lowest two bits (IO Space Indicator)
    
    // 3. Enable PCI Bus Mastering (Allow NIC to bypass CPU and push packets directly into RAM)
    uint16_t pci_cmd = pci_read_word(target_bus, target_slot, 0, 0x04);
    pci_write_word_local(target_bus, target_slot, 0, 0x04, pci_cmd | 0x04);
    
    // 4. Power On the NIC (Hardware Wakeup)
    outb(io_base + 0x52, 0x0);
    
    // 5. Trigger a Software Reset
    outb(io_base + 0x37, 0x10);
    uint32_t reset_timeout = 1000000;
    while((inb(io_base + 0x37) & 0x10) != 0 && reset_timeout > 0) { reset_timeout--; }
    
    // 6. Burn the unique MAC Address out of the NIC's EEPROM
    uint8_t mac[6];
    for(int i = 0; i < 6; i++) mac[i] = inb(io_base + i);
    printf("[NETWORK] NIC MAC Address: ");
    for(int i = 0; i < 6; i++) {
        print_hex(mac[i]);
        if (i < 5) printf(":");
    }
    printf("\n");
    
    // 7. Provision Physical RAM for the Receive Buffer (8KB + Overhead)
    uint8_t *rx_buffer = (uint8_t*)kmalloc(8192 + 16 + 1500);
    outl(io_base + 0x30, (uint32_t)rx_buffer); // Tell the hardware where the RAM is!
    
    // 8. Configure Interrupts (Alert the CPU when Transmit OK & Receive OK)
    outw(io_base + 0x3C, 0x0005);
    
    // 9. Configure Receive Buffer Options (Accept Broadcast, Multicast, Physical)
    outl(io_base + 0x44, 0xf | (1 << 7));
    
    // 10. Enable Receiver (RE) and Transmitter (TE) Pins
    outb(io_base + 0x37, 0x0C);
    
    printf("[NETWORK] TCP/IP Hardware Initialized! Awaiting Packets...\n");
}
