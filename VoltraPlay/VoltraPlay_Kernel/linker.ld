ENTRY(_start)

SECTIONS
{
    /* QEMU 'virt' machine physical RAM starts at 0x40000000 */
    . = 0x40000000;

    .text :
    {
        KEEP(*(.text.boot))
        *(.text)
    }

    .rodata :
    {
        *(.rodata)
    }

    .data :
    {
        *(.data)
    }

    .bss :
    {
        . = ALIGN(8);
        __bss_start = .;
        *(.bss)
        *(COMMON)
        . = ALIGN(8);
        __bss_end = .;
    }

    /* Set up an 8KB stack for the kernel */
    . = ALIGN(4096);
    . += 8192;
    __stack_top = .;
}
