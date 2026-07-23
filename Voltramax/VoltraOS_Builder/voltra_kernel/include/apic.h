/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - ADVANCED PROGRAMMABLE INTERRUPT CONTROLLER
 * ============================================================================
 * 
 * DESCRIPTION:
 * The legacy 8259 PIC can only handle single-core systems. To enable Symmetric 
 * Multiprocessing (SMP), we must disable the legacy PIC and initialize the 
 * Local APIC (LAPIC) present on every modern CPU core, and the I/O APIC which
 * routes external hardware interrupts to specific cores.
 * 
 * CORE CONCEPTS:
 * 1. LAPIC: Every CPU core has its own Local APIC. It manages local timer 
 *    interrupts, thermal sensors, and Inter-Processor Interrupts (IPIs) which
 *    allow cores to communicate (e.g., waking each other up or requesting TLB flushes).
 * 2. I/O APIC: A global chip that sits on the motherboard. It takes hardware IRQs
 *    (Keyboard, NVMe, Mouse) and routes them to specific CPU cores based on
 *    load balancing algorithms.
 * 3. ACPI MADT: To find these APICs, we must parse the ACPI tables (specifically 
 *    the Multiple APIC Description Table) provided by the BIOS/UEFI.
 * ============================================================================
 */

#ifndef APIC_H
#define APIC_H

#include <stdint.h>
#include <stdbool.h>

// LAPIC Registers (Memory Mapped)
#define LAPIC_ID            0x0020
#define LAPIC_VERSION       0x0030
#define LAPIC_TPR           0x0080
#define LAPIC_EOI           0x00B0
#define LAPIC_SVR           0x00F0
#define LAPIC_ESR           0x0280
#define LAPIC_ICR_LOW       0x0300
#define LAPIC_ICR_HIGH      0x0310
#define LAPIC_LVT_TIMER     0x0320
#define LAPIC_TIMER_INITCNT 0x0380
#define LAPIC_TIMER_CURCNT  0x0390
#define LAPIC_TIMER_DIV     0x03E0

// IPI Delivery Modes
#define IPI_DELIVERY_FIXED  0x000
#define IPI_DELIVERY_INIT   0x500
#define IPI_DELIVERY_SIPI   0x600

// ----------------------------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------------------------

/**
 * @brief Parses the ACPI MADT table to locate all CPU cores (LAPICs) and the I/O APIC.
 */
void acpi_parse_madt();

/**
 * @brief Initializes the Local APIC for the current executing CPU core.
 * Enables the spurious interrupt vector and sets the Task Priority Register.
 */
void lapic_init();

/**
 * @brief Signals the End of Interrupt (EOI) to the Local APIC.
 * Must be called at the end of every hardware interrupt handler so the APIC
 * knows it can send the next interrupt.
 */
void lapic_eoi();

/**
 * @brief Sends an Inter-Processor Interrupt (IPI) to a specific CPU core.
 * @param apic_id The target core's APIC ID.
 * @param vector The interrupt vector to trigger on the target core.
 */
void lapic_send_ipi(uint32_t apic_id, uint8_t vector);

/**
 * @brief Sends an INIT and SIPI sequence to wake up a sleeping Application Processor (AP).
 * @param apic_id The target core's APIC ID.
 * @param trampoline_page The physical page number (address >> 12) where the 16-bit boot code lives.
 */
void lapic_send_init_sipi(uint32_t apic_id, uint8_t trampoline_page);

/**
 * @brief Reads the APIC ID of the currently executing CPU core.
 * @return The APIC ID (0 for the Boot Strap Processor usually).
 */
uint32_t get_core_id();

/**
 * @brief Initializes the APIC Timer for the current core to drive the CFS Scheduler.
 */
void lapic_timer_init(uint32_t frequency);

#endif // APIC_H
