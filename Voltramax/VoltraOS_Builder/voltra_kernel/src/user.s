.global switch_to_user_mode
switch_to_user_mode:
    cli
    /* Load the Ring 3 Data Segment (0x20) ORed with RPL 3 = 0x23 */
    mov $0x23, %ax
    mov %ax, %ds
    mov %ax, %es
    mov %ax, %fs
    mov %ax, %gs
    
    /* Trick the CPU by pushing a fake interrupt frame to the stack */
    /* 1. Push Ring 3 Data Segment */
    pushl $0x23
    
    /* 2. Push current stack pointer */
    pushl %esp 
    
    /* 3. Push EFLAGS with Interrupts Enabled (0x200) */
    pushf
    popl %eax
    orl $0x200, %eax
    pushl %eax
    
    /* 4. Push Ring 3 Code Segment (0x18) ORed with RPL 3 = 0x1B */
    pushl $0x1B
    
    /* 5. Push the Instruction Pointer to return to (the instruction immediately after iret!) */
    pushl $1f 
    
    /* Boom. The CPU returns into User Mode! */
    iret
1:
    ret
