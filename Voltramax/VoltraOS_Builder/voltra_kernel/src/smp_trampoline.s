/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - SMP TRAMPOLINE
 * ============================================================================
 * 
 * DESCRIPTION:
 * When the Boot Strap Processor (BSP) wakes up an Application Processor (AP)
 * via an INIT-SIPI sequence, the AP wakes up in 16-bit REAL MODE. It has no
 * idea about our 32-bit/64-bit protected mode, our GDT, or our C code.
 * 
 * This file contains the 16-bit assembly "trampoline". The BSP copies this 
 * code to a specific low-memory address (e.g., 0x8000). The AP executes this
 * code, switches itself into 32-bit Protected Mode, sets up a fresh stack,
 * and then jumps into the C function `smp_ap_main`.
 * ============================================================================
 */

.code16
.global smp_trampoline_start
.global smp_trampoline_end
.global smp_ap_stack

smp_trampoline_start:
    cli                     # Disable interrupts immediately on the new core
    
    # Setup data segments for Real Mode
    xor %ax, %ax
    mov %ax, %ds
    mov %ax, %es
    mov %ax, %ss

    # Load the Global Descriptor Table (GDT) for Protected Mode
    # We must use a 32-bit physical address for the GDTR.
    # The BSP will dynamically patch the address at `smp_gdt_ptr` before waking us up.
    lgdtl cs:(smp_gdt_ptr - smp_trampoline_start)

    # Enable Protected Mode (Set PE bit in CR0)
    mov %cr0, %eax
    or $1, %al
    mov %eax, %cr0

    # Far jump to 32-bit code to flush the prefetch queue and set CS to our kernel code selector (0x08)
    # The BSP patches the exact 32-bit physical jump address here.
    ljmpl $0x08, $smp_protected_mode

.code32
.align 4
smp_protected_mode:
    # We are now in 32-bit Protected Mode!
    
    # Set up Data Segment registers (Selector 0x10)
    mov $0x10, %ax
    mov %ax, %ds
    mov %ax, %es
    mov %ax, %fs
    mov %ax, %gs
    mov %ax, %ss

    # Set up a unique stack for this CPU core.
    # The BSP dynamically sets `smp_ap_stack` before sending the SIPI.
    mov (smp_ap_stack), %esp

    # Jump to the C entry point for Application Processors!
    extern smp_ap_main
    call smp_ap_main

    # If smp_ap_main ever returns (it shouldn't), halt the CPU.
.halt_loop:
    cli
    hlt
    jmp .halt_loop

# -----------------------------------------------------------------------------
# Data patched by the BSP before waking up the AP
# -----------------------------------------------------------------------------
.align 4
smp_gdt_ptr:
    .word 0          # Limit (Patched by BSP)
    .long 0          # Base Address (Patched by BSP)

.align 4
smp_ap_stack:
    .long 0          # AP Stack Pointer (Patched by BSP)

smp_trampoline_end:
