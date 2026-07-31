#include "SyscallBridge.h"
#include <QDebug>
#include <errno.h>

#ifdef Q_OS_LINUX
#include <unistd.h>
#include <sys/syscall.h>
#endif

// The ultimate, raw execution pipeline directly into the Linux Kernel
long SyscallBridge::execute_linux_syscall(long sys_num, long a1, long a2, long a3, long a4, long a5, long a6) {
#ifdef Q_OS_LINUX
    long ret = syscall(sys_num, a1, a2, a3, a4, a5, a6);
    if (ret < 0) {
        qCritical() << "[SyscallBridge] KERNEL PANIC / ERROR. Syscall" << sys_num << "failed with errno:" << errno;
    }
    return ret;
#else
    return 0; // Windows IDE stub
#endif
}

// ----------------------------------------------------------------------------
// FILESYSTEM SYSCALLS
// ----------------------------------------------------------------------------
int SyscallBridge::open(const char* path, int flags, int mode) {
    qDebug() << "[SyscallBridge] Executing SYS_open for path:" << path;
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_open, (long)path, (long)flags, (long)mode);
#else
    return 3; 
#endif
}

int SyscallBridge::read(int fd, void* buf, size_t count) {
    qDebug() << "[SyscallBridge] Executing SYS_read on fd:" << fd << "size:" << count;
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_read, (long)fd, (long)buf, (long)count);
#else
    return count;
#endif
}

int SyscallBridge::write(int fd, const void* buf, size_t count) {
    qDebug() << "[SyscallBridge] Executing SYS_write on fd:" << fd << "size:" << count;
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_write, (long)fd, (long)buf, (long)count);
#else
    return count;
#endif
}

int SyscallBridge::close(int fd) {
    qDebug() << "[SyscallBridge] Executing SYS_close on fd:" << fd;
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_close, (long)fd);
#else
    return 0;
#endif
}

off_t SyscallBridge::lseek(int fd, off_t offset, int whence) {
    qDebug() << "[SyscallBridge] Executing SYS_lseek on fd:" << fd;
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_lseek, (long)fd, (long)offset, (long)whence);
#else
    return offset;
#endif
}

// ----------------------------------------------------------------------------
// MEMORY MANAGEMENT SYSCALLS
// ----------------------------------------------------------------------------
void* SyscallBridge::mmap(void* addr, size_t length, int prot, int flags, int fd, off_t offset) {
    qDebug() << "[SyscallBridge] Executing SYS_mmap length:" << length;
#ifdef Q_OS_LINUX
    return (void*)execute_linux_syscall(SYS_mmap, (long)addr, (long)length, (long)prot, (long)flags, (long)fd, (long)offset);
#else
    return nullptr;
#endif
}

int SyscallBridge::munmap(void* addr, size_t length) {
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_munmap, (long)addr, (long)length);
#else
    return 0;
#endif
}

int SyscallBridge::mprotect(void* addr, size_t len, int prot) {
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_mprotect, (long)addr, (long)len, (long)prot);
#else
    return 0;
#endif
}

// ----------------------------------------------------------------------------
// NETWORKING SYSCALLS
// ----------------------------------------------------------------------------
int SyscallBridge::socket(int domain, int type, int protocol) {
    qDebug() << "[SyscallBridge] Executing SYS_socket";
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_socket, (long)domain, (long)type, (long)protocol);
#else
    return 4;
#endif
}

int SyscallBridge::bind(int sockfd, const struct sockaddr *addr, socklen_t addrlen) {
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_bind, (long)sockfd, (long)addr, (long)addrlen);
#else
    return 0;
#endif
}

int SyscallBridge::connect(int sockfd, const struct sockaddr *addr, socklen_t addrlen) {
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_connect, (long)sockfd, (long)addr, (long)addrlen);
#else
    return 0;
#endif
}

int SyscallBridge::listen(int sockfd, int backlog) {
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_listen, (long)sockfd, (long)backlog);
#else
    return 0;
#endif
}

int SyscallBridge::accept(int sockfd, struct sockaddr *addr, socklen_t *addrlen) {
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_accept, (long)sockfd, (long)addr, (long)addrlen);
#else
    return 5;
#endif
}

// ----------------------------------------------------------------------------
// PROCESS & THREADING SYSCALLS
// ----------------------------------------------------------------------------
pid_t SyscallBridge::clone(int flags, void* child_stack) {
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_clone, (long)flags, (long)child_stack);
#else
    return 9999;
#endif
}

int SyscallBridge::futex(int *uaddr, int futex_op, int val, const struct timespec *timeout, int *uaddr2, int val3) {
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_futex, (long)uaddr, (long)futex_op, (long)val, (long)timeout, (long)uaddr2, (long)val3);
#else
    return 0;
#endif
}

int SyscallBridge::epoll_create1(int flags) {
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_epoll_create1, (long)flags);
#else
    return 6;
#endif
}
