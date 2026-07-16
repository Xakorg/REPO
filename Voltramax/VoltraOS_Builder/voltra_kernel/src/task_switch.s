.global perform_task_switch
perform_task_switch:
    /* Read arguments before modifying stack */
    /* arg1: pointer to current task's ESP variable */
    mov 4(%esp), %eax   
    /* arg2: the next task's ESP */
    mov 8(%esp), %ecx   

    /* Save the C Callee-Saved Registers for the CURRENT thread */
    push %ebx
    push %esi
    push %edi
    push %ebp

    /* Save the current stack pointer into the current task_t->esp */
    mov %esp, (%eax)

    /* MAGICAL THREAD SWAP! Overwrite the CPU's Stack Pointer with the NEW Thread's Stack! */
    mov %ecx, %esp

    /* Restore the registers that belonged to the NEW thread when it was last paused */
    pop %ebp
    pop %edi
    pop %esi
    pop %ebx

    /* Return seamlessly into the new thread! */
    ret
