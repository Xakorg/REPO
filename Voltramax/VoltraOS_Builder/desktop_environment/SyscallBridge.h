#ifndef SYSCALL_BRIDGE_H
#define SYSCALL_BRIDGE_H

#include <stdint.h>
#include <stddef.h>

/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE - RING 3 SYSCALL BRIDGE
 * ============================================================================
 * 
 * This library bridges the C++ User Space applications (Volt Shell, OOBE) 
 * directly to the VoltraOS C Kernel running in Ring 0.
 * 
 * It uses inline assembly `int 0x80` to trigger the hardware interrupt 
 * vector, passing the syscall number in EAX and arguments in EBX, ECX, EDX.
 * ============================================================================
 */

// VoltraOS Syscall Numbers
#define SYS_WRITE   4
#define SYS_OPEN    5
#define SYS_CLOSE   6
#define SYS_SOCKET  359
#define SYS_BIND    360
#define SYS_CONNECT 362

class SyscallBridge {
public:
    // File System (VFS) Syscalls
    static int open(const char* path, int flags);
    static int write(int fd, const void* buf, size_t count);
    static int close(int fd);
    
    // Network (TCP/IP) Syscalls
    static int socket();
    static int bind(int sockfd, uint32_t ip, uint16_t port);
    static int connect(int sockfd, uint32_t ip, uint16_t port);
    
private:
    // The raw hardware interrupt wrapper
    static inline int syscall3(uint32_t syscall_num, uint32_t arg1, uint32_t arg2, uint32_t arg3) {
        int ret;
        // In a real VoltraOS environment (not a Windows host mock), this triggers Ring 0.
        // We use preprocessor checks to prevent this from crashing the mock environment.
#ifdef __VOLTRA_OS__
        asm volatile (
            "int $0x80"
            : "=a" (ret)
            : "a" (syscall_num), "b" (arg1), "c" (arg2), "d" (arg3)
            : "memory"
        );
#else
        // Mock return for Windows/Linux host compilation
        ret = 0; 
#endif
        return ret;
    }
};

#endif // SYSCALL_BRIDGE_H
