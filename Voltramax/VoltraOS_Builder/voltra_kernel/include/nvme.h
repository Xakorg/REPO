#ifndef VOLTRA_NVME_H
#define VOLTRA_NVME_H

#include <stdint.h>
#include "pci.h"

// ----------------------------------------------------------------------------
// VoltraOS Enterprise Kernel - NVMe PCIe Driver Header
// ----------------------------------------------------------------------------

typedef volatile struct {
    uint64_t cap;       // Controller Capabilities
    uint32_t vs;        // Version
    uint32_t intms;     // Interrupt Mask Set
    uint32_t intmc;     // Interrupt Mask Clear
    uint32_t cc;        // Controller Configuration
    uint32_t rsvd1;     // Reserved
    uint32_t csts;      // Controller Status
    uint32_t nssr;      // NVM Subsystem Reset
    uint32_t aqa;       // Admin Queue Attributes
    uint64_t asq;       // Admin Submission Queue Base Address
    uint64_t acq;       // Admin Completion Queue Base Address
    uint32_t cmbloc;    // Controller Memory Buffer Location
    uint32_t cmbsz;     // Controller Memory Buffer Size
} nvme_bar_t;

// Function Prototypes
void nvme_init_driver(void);

#endif // VOLTRA_NVME_H
