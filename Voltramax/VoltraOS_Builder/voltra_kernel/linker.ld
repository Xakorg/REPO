/*
 * Voltra Kernel Linker Script
 * Tells the compiler exactly how to structure the final kernel binary in memory.
 */

ENTRY(_start)

SECTIONS {
    /* Bootloaders load kernels at 1MB physical memory. */
    . = 1M;

    /* The multiboot header MUST come very early in the binary so GRUB finds it. */
    .text BLOCK(4K) : ALIGN(4K) {
        *(.multiboot)
        *(.text)
    }

    /* Read-only data. */
    .rodata BLOCK(4K) : ALIGN(4K) {
        *(.rodata)
    }

    /* Read-write data (initialized). */
    .data BLOCK(4K) : ALIGN(4K) {
        *(.data)
    }

    /* Read-write data (uninitialized) and stack. */
    .bss BLOCK(4K) : ALIGN(4K) {
        *(COMMON)
        *(.bss)
    }
}
