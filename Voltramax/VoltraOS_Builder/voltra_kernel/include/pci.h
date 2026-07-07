#ifndef PCI_H
#define PCI_H

#include <stdint.h>

#define PCI_CONFIG_ADDRESS 0xCF8
#define PCI_CONFIG_DATA    0xCFC

uint16_t pci_read_word(uint8_t bus, uint8_t slot, uint8_t func, uint8_t offset);
uint16_t pci_get_vendor_id(uint8_t bus, uint8_t slot, uint8_t func);
uint16_t pci_get_device_id(uint8_t bus, uint8_t slot, uint8_t func);
void pci_scan_bus(void);

#endif
