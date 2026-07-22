#ifndef VOLTRA_PCI_H
#define VOLTRA_PCI_H

#include <stdint.h>
#include <stdbool.h>

// ----------------------------------------------------------------------------
// VoltraOS Enterprise Kernel - PCI Subsystem & Driver Model
// ----------------------------------------------------------------------------

#define PCI_CONFIG_ADDRESS 0xCF8
#define PCI_CONFIG_DATA    0xCFC

// PCI Configuration Space Offsets
#define PCI_VENDOR_ID           0x00
#define PCI_DEVICE_ID           0x02
#define PCI_COMMAND             0x04
#define PCI_STATUS              0x06
#define PCI_REVISION_ID         0x08
#define PCI_PROG_IF             0x09
#define PCI_SUBCLASS            0x0A
#define PCI_CLASS               0x0B
#define PCI_CACHE_LINE_SIZE     0x0C
#define PCI_LATENCY_TIMER       0x0D
#define PCI_HEADER_TYPE         0x0E
#define PCI_BIST                0x0F
#define PCI_BAR0                0x10
#define PCI_BAR1                0x14
#define PCI_BAR2                0x18
#define PCI_BAR3                0x1C
#define PCI_BAR4                0x20
#define PCI_BAR5                0x24
#define PCI_INTERRUPT_LINE      0x3C
#define PCI_INTERRUPT_PIN       0x3D

// Header Types
#define PCI_HEADER_TYPE_DEVICE  0x00
#define PCI_HEADER_TYPE_BRIDGE  0x01
#define PCI_HEADER_TYPE_CARDBUS 0x02
#define PCI_HEADER_TYPE_MFD     0x80 // Multi-Function Device mask

// Base Address Register (BAR) Types
#define PCI_BAR_TYPE_MMIO       0x00
#define PCI_BAR_TYPE_IO         0x01

// ----------------------------------------------------------------------------
// Data Structures
// ----------------------------------------------------------------------------

typedef struct {
    uint8_t type;         // MMIO or IO
    uint32_t address;     // Base address
    uint32_t size;        // Memory chunk size
    uint32_t flags;       // Prefetchable, 64-bit, etc.
} pci_bar_t;

// The Voltra Device Model (VDM) Representation of a PCI Device
typedef struct pci_device {
    uint8_t bus;
    uint8_t slot;
    uint8_t func;
    
    uint16_t vendor_id;
    uint16_t device_id;
    
    uint8_t class_code;
    uint8_t subclass;
    uint8_t prog_if;
    uint8_t revision;
    
    uint8_t irq_pin;
    uint8_t irq_line;
    
    pci_bar_t bars[6];
    
    // Linked list of all discovered devices in the system
    struct pci_device* next;
    
    // Pointer to the loaded driver if one matched
    struct pci_driver* driver;
} pci_device_t;

// The Voltra Driver Model (VDM) Driver Registration
typedef struct pci_driver {
    const char* name;
    
    // An array of VendorID/DeviceID pairs this driver supports
    // Terminated by 0xFFFF, 0xFFFF
    uint16_t* supported_vendors;
    uint16_t* supported_devices;
    
    // Function Pointers (Callbacks for the Kernel)
    bool (*probe)(pci_device_t* dev);
    void (*remove)(pci_device_t* dev);
    void (*suspend)(pci_device_t* dev);
    void (*resume)(pci_device_t* dev);
    
    struct pci_driver* next;
} pci_driver_t;

// ----------------------------------------------------------------------------
// Subsystem API
// ----------------------------------------------------------------------------

// Low-Level I/O
uint32_t pci_read_dword(uint8_t bus, uint8_t slot, uint8_t func, uint8_t offset);
uint16_t pci_read_word(uint8_t bus, uint8_t slot, uint8_t func, uint8_t offset);
uint8_t  pci_read_byte(uint8_t bus, uint8_t slot, uint8_t func, uint8_t offset);

void pci_write_dword(uint8_t bus, uint8_t slot, uint8_t func, uint8_t offset, uint32_t val);
void pci_write_word(uint8_t bus, uint8_t slot, uint8_t func, uint8_t offset, uint16_t val);

// Subsystem Initialization
void voltra_pci_init(void);
void pci_scan_bus(void);

// Driver API
void voltra_register_pci_driver(pci_driver_t* driver);
pci_device_t* pci_get_device(uint16_t vendor_id, uint16_t device_id);

// Utility
const char* pci_get_class_name(uint8_t class_code, uint8_t subclass);

#endif // VOLTRA_PCI_H
