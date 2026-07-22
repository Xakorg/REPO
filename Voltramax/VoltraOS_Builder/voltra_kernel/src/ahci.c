#include "ahci.h"
#include "pci.h"
#include "string.h"
#include "vga.h"

// ----------------------------------------------------------------------------
// VoltraOS Enterprise Kernel - AHCI (SATA) Driver Implementation
// ----------------------------------------------------------------------------

static pci_driver_t ahci_driver;

// The device IDs we support. 0xFFFF terminates the list.
// Standard AHCI class code is Class 01, Subclass 06.
// We'll use a generic PCI match instead of hardcoding all Vendor IDs.
static uint16_t ahci_vendors[] = { 0x8086 /* Intel */, 0x1022 /* AMD */, 0xFFFF };
static uint16_t ahci_devices[] = { 0xFFFF, 0xFFFF }; // 0xFFFF means any device ID from that vendor (handled by probe logic)

static int check_port_type(hba_port_t *port) {
    uint32_t ssts = port->ssts;
    
    uint8_t ipm = (ssts >> 8) & 0x0F;
    uint8_t det = ssts & 0x0F;
    
    if (det != HBA_PORT_DET_PRESENT) return 0;
    if (ipm != HBA_PORT_IPM_ACTIVE) return 0;
    
    switch (port->sig) {
        case AHCI_PORT_SIG_ATAPI:
            return 2; // SATAPI
        case AHCI_PORT_SIG_SEMB:
            return 3; // SEMB
        case AHCI_PORT_SIG_PM:
            return 4; // PM
        default:
            return 1; // SATA
    }
}

static void probe_port(hba_mem_t *abar) {
    // Search implemented ports
    uint32_t pi = abar->pi;
    for (int i = 0; i < 32; i++) {
        if (pi & 1) {
            int dt = check_port_type(&abar->ports[i]);
            if (dt == 1) {
                printf("    [AHCI] Found SATA Drive on Port %d\n", i);
            } else if (dt == 2) {
                printf("    [AHCI] Found SATAPI Drive on Port %d\n", i);
            }
        }
        pi >>= 1;
    }
}

static bool ahci_probe(pci_device_t* dev) {
    // Generic AHCI match: Class 0x01 (Mass Storage), Subclass 0x06 (SATA), ProgIF 0x01 (AHCI)
    if (dev->class_code == 0x01 && dev->subclass == 0x06 && dev->prog_if == 0x01) {
        printf("  [VOLTRA-VDM] Binding AHCI Driver to PCI Device (Ven: ");
        print_hex(dev->vendor_id); printf(" Dev: "); print_hex(dev->device_id); printf(")\n");
        
        // Ensure MMIO BAR5 is present (AHCI ABAR)
        if (dev->bars[5].type != PCI_BAR_TYPE_MMIO || dev->bars[5].address == 0) {
            printf("    [AHCI-ERR] No valid ABAR (BAR5) found!\n");
            return false;
        }
        
        // Map the physical address to virtual memory (Assuming 1:1 mapping in early boot)
        uint32_t phys_addr = dev->bars[5].address;
        hba_mem_t* abar = (hba_mem_t*)(phys_addr);
        
        probe_port(abar);
        return true;
    }
    return false; // Not an AHCI controller
}

static void ahci_remove(pci_device_t* dev) {
    printf("  [VOLTRA-VDM] Unbinding AHCI Driver from Device.\n");
}

void ahci_init_driver(void) {
    ahci_driver.name = "Voltra AHCI SATA Driver";
    ahci_driver.supported_vendors = ahci_vendors;
    ahci_driver.supported_devices = ahci_devices;
    
    ahci_driver.probe = ahci_probe;
    ahci_driver.remove = ahci_remove;
    ahci_driver.suspend = NULL;
    ahci_driver.resume = NULL;
    
    voltra_register_pci_driver(&ahci_driver);
    printf("[VOLTRA-VDM] Registered: %s\n", ahci_driver.name);
}
