#ifndef VFS_H
#define VFS_H

#include <stdint.h>

#define FS_FILE        0x01
#define FS_DIRECTORY   0x02
#define FS_CHARDEVICE  0x03
#define FS_BLOCKDEVICE 0x04
#define FS_PIPE        0x05
#define FS_SYMLINK     0x06
#define FS_MOUNTPOINT  0x08 

struct vfs_node;

// Function pointers for file operations
typedef uint32_t (*read_type_t)(struct vfs_node*, uint32_t, uint32_t, uint8_t*);
typedef uint32_t (*write_type_t)(struct vfs_node*, uint32_t, uint32_t, uint8_t*);
typedef void (*open_type_t)(struct vfs_node*);
typedef void (*close_type_t)(struct vfs_node*);
typedef struct dirent * (*readdir_type_t)(struct vfs_node*, uint32_t);
typedef struct vfs_node * (*finddir_type_t)(struct vfs_node*, char *name);

typedef struct vfs_node {
    char name[128];     // The requested filename.
    uint32_t mask;      // The permissions mask.
    uint32_t uid;       // The owning user.
    uint32_t gid;       // The owning group.
    uint32_t flags;     // Includes the node type.
    uint32_t inode;     // This is device-specific - provides a way for a filesystem to identify files.
    uint32_t length;    // Size of the file, in bytes.
    uint32_t impl;      // An implementation-defined number.
    
    // Virtual Function Pointers
    read_type_t read;
    write_type_t write;
    open_type_t open;
    close_type_t close;
    readdir_type_t readdir;
    finddir_type_t finddir;
    
    struct vfs_node *ptr; // Used by mountpoints and symlinks.
} vfs_node_t;

// Directory entry structure
struct dirent {
    char name[128]; // Filename
    uint32_t ino;   // Inode number
};

// Global root of our filesystem
extern vfs_node_t *vfs_root;

// Standard API for the rest of the OS to use
uint32_t vfs_read(vfs_node_t *node, uint32_t offset, uint32_t size, uint8_t *buffer);
uint32_t vfs_write(vfs_node_t *node, uint32_t offset, uint32_t size, uint8_t *buffer);
void vfs_open(vfs_node_t *node, uint8_t read, uint8_t write);
void vfs_close(vfs_node_t *node);
struct dirent *vfs_readdir(vfs_node_t *node, uint32_t index);
vfs_node_t *vfs_finddir(vfs_node_t *node, char *name);

#endif
