#ifndef SYSCALL_BRIDGE_H
#define SYSCALL_BRIDGE_H

#include <stdint.h>
#include <stddef.h>

/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE - NATIVE LINUX SYSCALL BRIDGE
 * ============================================================================
 * 
 * VoltraOS is built natively on top of the Linux Kernel.
 * This class abstracts raw POSIX System Calls (syscalls) to interact
 * directly with the Linux Kernel running in Ring 0, bypassing bloated libc
 * wrappers where maximum performance is required.
 * ============================================================================
 */

class SyscallBridge {
public:
    // Core POSIX Filesystem Syscalls via Linux Kernel
    static int open(const char* path, int flags);
    static int write(int fd, const void* buf, size_t count);
    static int close(int fd);

    // Advanced Networking Syscalls via Linux Kernel
    static int socket();
    static int bind(int sockfd, uint32_t ip, uint16_t port);
    static int connect(int sockfd, uint32_t ip, uint16_t port);

private:
    // Internal wrapper to trigger the native Linux `syscall()` instruction
    static int execute_linux_syscall(long sys_num, long arg1 = 0, long arg2 = 0, long arg3 = 0);
};

#endif // SYSCALL_BRIDGE_H
