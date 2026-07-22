#ifndef VOLTRA_AHCI_H
#define VOLTRA_AHCI_H

#include <stdint.h>
#include "pci.h"

// ----------------------------------------------------------------------------
// VoltraOS Enterprise Kernel - AHCI (SATA) Driver Header
// ----------------------------------------------------------------------------

#define AHCI_PORT_SIG_SATA   0x00000101 // SATA drive
#define AHCI_PORT_SIG_ATAPI  0xEB140101 // SATAPI drive
#define AHCI_PORT_SIG_SEMB   0xC33C0101 // Enclosure management bridge
#define AHCI_PORT_SIG_PM     0x96690101 // Port multiplier

#define HBA_PORT_IPM_ACTIVE  1
#define HBA_PORT_DET_PRESENT 3

typedef volatile struct {
    uint32_t clb;       // Command list base address, 1K-byte aligned
    uint32_t clbu;      // Command list base address upper 32 bits
    uint32_t fb;        // FIS base address, 256-byte aligned
    uint32_t fbu;       // FIS base address upper 32 bits
    uint32_t is;        // Interrupt status
    uint32_t ie;        // Interrupt enable
    uint32_t cmd;       // Command and status
    uint32_t rsv0;      // Reserved
    uint32_t tfd;       // Task file data
    uint32_t sig;       // Signature
    uint32_t ssts;      // SATA status (SCR0:SStatus)
    uint32_t sctl;      // SATA control (SCR2:SControl)
    uint32_t serr;      // SATA error (SCR1:SError)
    uint32_t sact;      // SATA active (SCR3:SActive)
    uint32_t ci;        // Command issue
    uint32_t sntf;      // SATA notification (SCR4:SNotification)
    uint32_t fbs;       // FIS-based switch control
    uint32_t rsv1[11];  // Reserved
    uint32_t vendor[4]; // Vendor specific
} hba_port_t;

typedef volatile struct {
    uint32_t cap;       // Host capability
    uint32_t ghc;       // Global host control
    uint32_t is;        // Interrupt status
    uint32_t pi;        // Port implemented
    uint32_t vs;        // Version
    uint32_t ccc_ctl;   // Command completion coalescing control
    uint32_t ccc_pts;   // Command completion coalescing ports
    uint32_t em_loc;    // Enclosure management location
    uint32_t em_ctl;    // Enclosure management control
    uint32_t cap2;      // Host capabilities extended
    uint32_t bohc;      // BIOS/OS handoff control and status
    uint8_t  rsv[0xA0-0x2C];
    uint8_t  vendor[0x100-0xA0];
    hba_port_t ports[32]; // Maximum 32 ports
} hba_mem_t;

// Function Prototypes
void ahci_init_driver(void);

#endif // VOLTRA_AHCI_H
