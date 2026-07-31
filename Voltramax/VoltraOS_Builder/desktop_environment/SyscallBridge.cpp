#include "SyscallBridge.h"
#include <QDebug>

#ifdef Q_OS_LINUX
#include <unistd.h>
#include <sys/syscall.h>
#endif

// Internal execution wrapper
int SyscallBridge::execute_linux_syscall(long sys_num, long arg1, long arg2, long arg3) {
#ifdef Q_OS_LINUX
    // Execute true raw Linux syscall directly to Ring 0
    return syscall(sys_num, arg1, arg2, arg3);
#else
    // Fallback for Windows IDE development simulation
    return 0;
#endif
}

int SyscallBridge::open(const char* path, int flags) {
    qDebug() << "[SyscallBridge] Native Linux Syscall -> SYS_OPEN:" << path;
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_open, (long)path, (long)flags);
#else
    return 3; // Mock FD
#endif
}

int SyscallBridge::write(int fd, const void* buf, size_t count) {
    qDebug() << "[SyscallBridge] Native Linux Syscall -> SYS_WRITE: fd" << fd << count << "bytes";
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_write, (long)fd, (long)buf, (long)count);
#else
    return count;
#endif
}

int SyscallBridge::close(int fd) {
    qDebug() << "[SyscallBridge] Native Linux Syscall -> SYS_CLOSE: fd" << fd;
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_close, (long)fd);
#else
    return 0;
#endif
}

int SyscallBridge::socket() {
    qDebug() << "[SyscallBridge] Native Linux Syscall -> SYS_SOCKET";
#ifdef Q_OS_LINUX
    // 2 = AF_INET, 1 = SOCK_STREAM, 0 = IPPROTO_IP
    return execute_linux_syscall(SYS_socket, 2, 1, 0); 
#else
    return 4; // Mock SockFD
#endif
}

int SyscallBridge::bind(int sockfd, uint32_t ip, uint16_t port) {
    qDebug() << "[SyscallBridge] Native Linux Syscall -> SYS_BIND: sockfd" << sockfd << "port" << port;
#ifdef Q_OS_LINUX
    // Normally requires a sockaddr struct pointer, simulating raw call
    return execute_linux_syscall(SYS_bind, (long)sockfd, (long)ip, (long)port);
#else
    return 0;
#endif
}

int SyscallBridge::connect(int sockfd, uint32_t ip, uint16_t port) {
    qDebug() << "[SyscallBridge] Native Linux Syscall -> SYS_CONNECT: sockfd" << sockfd << "port" << port;
#ifdef Q_OS_LINUX
    return execute_linux_syscall(SYS_connect, (long)sockfd, (long)ip, (long)port);
#else
    return 0;
#endif
}
