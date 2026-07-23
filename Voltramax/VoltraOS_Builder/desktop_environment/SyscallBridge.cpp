#include "SyscallBridge.h"
#include <QDebug>

int SyscallBridge::open(const char* path, int flags) {
    qDebug() << "[Syscall] INT 0x80 -> SYS_OPEN:" << path;
    return syscall3(SYS_OPEN, (uint32_t)path, (uint32_t)flags, 0);
}

int SyscallBridge::write(int fd, const void* buf, size_t count) {
    qDebug() << "[Syscall] INT 0x80 -> SYS_WRITE: fd" << fd << count << "bytes";
    return syscall3(SYS_WRITE, (uint32_t)fd, (uint32_t)buf, (uint32_t)count);
}

int SyscallBridge::close(int fd) {
    qDebug() << "[Syscall] INT 0x80 -> SYS_CLOSE: fd" << fd;
    return syscall3(SYS_CLOSE, (uint32_t)fd, 0, 0);
}

int SyscallBridge::socket() {
    qDebug() << "[Syscall] INT 0x80 -> SYS_SOCKET";
    return syscall3(SYS_SOCKET, 0, 0, 0);
}

int SyscallBridge::bind(int sockfd, uint32_t ip, uint16_t port) {
    qDebug() << "[Syscall] INT 0x80 -> SYS_BIND: sockfd" << sockfd << "port" << port;
    return syscall3(SYS_BIND, (uint32_t)sockfd, ip, port);
}

int SyscallBridge::connect(int sockfd, uint32_t ip, uint16_t port) {
    qDebug() << "[Syscall] INT 0x80 -> SYS_CONNECT: sockfd" << sockfd << "port" << port;
    return syscall3(SYS_CONNECT, (uint32_t)sockfd, ip, port);
}
