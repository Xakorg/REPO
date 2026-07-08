.section .text.boot
.global _start

_start:
    /* Read CPU ID register (MPIDR_EL1) into x0 */
    mrs x0, mpidr_el1
    /* Extract the core ID (bits 0-7) */
    and x0, x0, #0xFF
    /* If it's not core 0, put it to sleep (we only want 1 core to boot initially) */
    cbnz x0, halt

    /* Set the stack pointer to our defined top of stack from the linker script */
    ldr x1, =__stack_top
    mov sp, x1

    /* Clear the BSS segment (zero-initialize uninitialized variables) */
    ldr x1, =__bss_start
    ldr x2, =__bss_end
    mov x3, #0
clear_bss:
    cmp x1, x2
    b.ge bss_cleared
    str x3, [x1], #8
    b clear_bss

bss_cleared:
    /* Branch to our C kernel main function! */
    bl kmain

halt:
    /* Infinite loop for sleeping cores or if kmain returns */
    wfe
    b halt
