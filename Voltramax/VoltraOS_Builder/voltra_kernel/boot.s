/*
 * VOLTRA KERNEL BOOTLOADER ENTRY
 * This Assembly code is the very first thing that runs when the computer turns on!
 */

/* Multiboot Header Magic constants so GRUB knows this is a real OS */
.set ALIGN,    1<<0             
.set MEMINFO,  1<<1             
.set VIDMODE,  1<<2
.set FLAGS,    ALIGN | MEMINFO | VIDMODE
.set MAGIC,    0x1BADB002       
.set CHECKSUM, -(MAGIC + FLAGS) 

/* Declare the Multiboot header */
.section .multiboot
.align 4
.long MAGIC
.long FLAGS
.long CHECKSUM
.long 0, 0, 0, 0, 0
.long 0
.long 1024
.long 768
.long 32

/* Set up the initial stack (16KB) for our C code to run */
.section .bss
.align 16
stack_bottom:
.skip 16384 # 16 KiB
stack_top:

/* The actual entry point where the CPU starts executing our code! */
.section .text
.global _start
.type _start, @function
_start:
    /* Point the CPU stack pointer to the top of our newly created stack */
    mov $stack_top, %esp

    /* Push Multiboot Info structure pointer and Magic Number */
    push %ebx
    push %eax

    /* Call our C kernel main function! */
    call kernel_main

    /* If the C code ever finishes, we disable interrupts and halt the CPU forever. */
    cli
1:  hlt
    jmp 1b

.size _start, . - _start
