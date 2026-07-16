.global tss_flush
tss_flush:
    /* Load the TSS Entry (Index 5 in the GDT, 5*8 = 40 = 0x28) ORed with RPL 3 = 0x2B */
    mov $0x2B, %ax
    ltr %ax
    ret
