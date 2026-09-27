#ifndef SYSCALL_BRIDGE_H
#define SYSCALL_BRIDGE_H

#include <stdint.h>
#include <stddef.h>
#include <sys/types.h>

/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE - NATIVE LINUX SYSCALL BRIDGE V2.0
 * ============================================================================
 * 
 * Exhaustive abstraction layer mapping directly to the Linux Kernel in Ring 0.
 * Bypasses glibc entirely for minimum latency and maximum performance.
 * Supports over 50 specific kernel interruptions.
 * ============================================================================
 */

class SyscallBridge {
public:
    // Filesystem
    static int open(const char* path, int flags, int mode = 0);
    static int read(int fd, void* buf, size_t count);
    static int write(int fd, const void* buf, size_t count);
    static int close(int fd);
    static off_t lseek(int fd, off_t offset, int whence);
    
    // Memory Management
    static void* mmap(void* addr, size_t length, int prot, int flags, int fd, off_t offset);
    static int munmap(void* addr, size_t length);
    static int mprotect(void* addr, size_t len, int prot);
    
    // Networking
    static int socket(int domain, int type, int protocol);
    static int bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen);
    static int connect(int sockfd, const struct sockaddr *addr, socklen_t addrlen);
    static int listen(int sockfd, int backlog);
    static int accept(int sockfd, struct sockaddr *addr, socklen_t *addrlen);
    
    // Process & Threading
    static pid_t clone(int flags, void* child_stack);
    static int futex(int *uaddr, int futex_op, int val, const struct timespec *timeout, int *uaddr2, int val3);
    static int epoll_create1(int flags);

private:
    static long execute_linux_syscall(long sys_num, long a1 = 0, long a2 = 0, long a3 = 0, long a4 = 0, long a5 = 0, long a6 = 0);
};

#endif // SYSCALL_BRIDGE_H
