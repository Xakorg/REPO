/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - APIC IMPLEMENTATION
 * ============================================================================
 * 
 * This file implements the Local APIC and SMP Bootstrapping logic.
 * 
 * HARDWARE NOTE: The LAPIC is interacted with via Memory Mapped I/O (MMIO).
 * The BIOS maps the LAPIC registers to a specific physical memory address 
 * (usually 0xFEE00000). We read and write 32-bit integers directly to these 
 * memory addresses to control the CPU hardware.
 * ============================================================================
 */

#include "apic.h"
#include "vga.h"
#include "ports.h"

// The base address of the LAPIC (Mapped by the MMU, usually 0xFEE00000)
volatile uint32_t* lapic_base = (uint32_t*)0xFEE00000;

// Array of detected CPU Core APIC IDs
uint32_t smp_cpu_ids[256];
uint32_t smp_cpu_count = 0;

// ----------------------------------------------------------------------------
// MMIO READ/WRITE HELPERS
// ----------------------------------------------------------------------------
static inline uint32_t lapic_read(uint32_t reg) {
    return *((volatile uint32_t*)((uint8_t*)lapic_base + reg));
}

static inline void lapic_write(uint32_t reg, uint32_t value) {
    *((volatile uint32_t*)((uint8_t*)lapic_base + reg)) = value;
}

// ----------------------------------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------------------------------

void acpi_parse_madt() {
    // In a real OS, we scan physical memory for the RSDP signature, 
    // traverse to the RSDT, find the MADT, and parse the APIC structures.
    // [STUB]: Simulating ACPI parsing for architecture layout.
    
    // We assume the BIOS told us we have 4 CPU Cores.
    smp_cpu_count = 4;
    smp_cpu_ids[0] = 0; // BSP (Boot Strap Processor)
    smp_cpu_ids[1] = 1; // AP 1
    smp_cpu_ids[2] = 2; // AP 2
    smp_cpu_ids[3] = 3; // AP 3
}

void lapic_init() {
    // 1. Enable the LAPIC and set the Spurious Interrupt Vector to 0xFF.
    // Bit 8 enables the APIC.
    lapic_write(LAPIC_SVR, 0x100 | 0xFF);

    // 2. Clear the Error Status Register
    lapic_write(LAPIC_ESR, 0);

    // 3. Acknowledge any pending interrupts
    lapic_write(LAPIC_EOI, 0);

    // 4. Set the Task Priority Register to 0 (Accept all interrupts)
    lapic_write(LAPIC_TPR, 0);
}

void lapic_eoi() {
    lapic_write(LAPIC_EOI, 0);
}

uint32_t get_core_id() {
    // Read the LAPIC ID register. Bits 24-31 contain the ID.
    return lapic_read(LAPIC_ID) >> 24;
}

// ----------------------------------------------------------------------------
// SMP IPI (INTER-PROCESSOR INTERRUPTS)
// ----------------------------------------------------------------------------

void lapic_send_ipi(uint32_t apic_id, uint8_t vector) {
    // Write the target APIC ID to the high 32 bits of the ICR
    lapic_write(LAPIC_ICR_HIGH, (apic_id << 24));
    
    // Write the vector and fixed delivery mode to the low 32 bits.
    // This triggers the hardware to send the message across the APIC bus.
    lapic_write(LAPIC_ICR_LOW, vector | IPI_DELIVERY_FIXED);
    
    // Wait for delivery status bit to clear (Bit 12)
    while (lapic_read(LAPIC_ICR_LOW) & (1 << 12)) {
        asm volatile("pause");
    }
}

void lapic_send_init_sipi(uint32_t apic_id, uint8_t trampoline_page) {
    // 1. Send INIT (Assert)
    lapic_write(LAPIC_ICR_HIGH, (apic_id << 24));
    lapic_write(LAPIC_ICR_LOW, IPI_DELIVERY_INIT | (1 << 14)); // Level Assert
    
    // Delay 10ms
    for(volatile int d=0; d<10000000; d++); 

    // 2. Send INIT (De-assert)
    lapic_write(LAPIC_ICR_HIGH, (apic_id << 24));
    lapic_write(LAPIC_ICR_LOW, IPI_DELIVERY_INIT | (0 << 14)); // Level De-assert
    
    // Delay 10ms
    for(volatile int d=0; d<10000000; d++); 

    // 3. Send SIPI (Startup IPI) with the trampoline page vector!
    // The target CPU will instantly wake up in 16-bit real mode and start 
    // executing code at physical address (trampoline_page << 12).
    lapic_write(LAPIC_ICR_HIGH, (apic_id << 24));
    lapic_write(LAPIC_ICR_LOW, IPI_DELIVERY_SIPI | trampoline_page);
    
    // Delay 1ms
    for(volatile int d=0; d<1000000; d++); 
}

// ----------------------------------------------------------------------------
// LAPIC TIMER (DRIVES THE SCHEDULER)
// ----------------------------------------------------------------------------

void lapic_timer_init(uint32_t frequency) {
    // 1. Set Divider to 16
    lapic_write(LAPIC_TIMER_DIV, 0x03);

    // 2. Set Initial Count (Simulated based on bus frequency)
    lapic_write(LAPIC_TIMER_INITCNT, 100000000 / frequency);

    // 3. Enable Timer in Periodic Mode (Bit 17) mapping to interrupt vector 0x20
    lapic_write(LAPIC_LVT_TIMER, 0x20 | (1 << 17));
}
