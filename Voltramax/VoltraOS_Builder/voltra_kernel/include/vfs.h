/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - VIRTUAL FILE SYSTEM (VFS)
 * ============================================================================
 * 
 * DESCRIPTION:
 * The original VoltraOS hardcoded everything to FAT32. An Enterprise OS 
 * requires a generic Virtual File System (VFS) abstraction layer so that 
 * applications can read files transparently, regardless of whether they are 
 * on an Ext4 SSD, an NTFS hard drive, or a virtual /proc memory system.
 * 
 * CORE ABSTRACTIONS (Inspired by Linux VFS):
 * 1. Superblock: Represents a mounted filesystem (e.g., Ext4 on /dev/sda1).
 * 2. Inode (Index Node): Represents a specific file or directory on disk. 
 *    Contains metadata (permissions, size, timestamps).
 * 3. Dentry (Directory Entry): Represents the hierarchical tree (names). 
 *    Provides ultra-fast O(1) path resolution via the Dentry Cache (dcache).
 * 4. File: Represents an *open* file by a process. Contains the current 
 *    read/write offset.
 * ============================================================================
 */

#ifndef VFS_H
#define VFS_H

#include <stdint.h>
#include <stdbool.h>

#define MAX_FILENAME 256
#define MAX_MOUNTPOINTS 32

// Forward Declarations
struct inode;
struct dentry;
struct file;
struct superblock;

// ----------------------------------------------------------------------------
// FILESYSTEM OPERATIONS (Function Pointers)
// ----------------------------------------------------------------------------
// Every concrete filesystem (Ext4, FAT32) must implement these callbacks.

typedef struct inode_operations {
    struct inode* (*lookup)(struct inode* dir, const char* name);
    int (*create)(struct inode* dir, const char* name, uint32_t mode);
    int (*mkdir)(struct inode* dir, const char* name, uint32_t mode);
} inode_ops_t;

typedef struct file_operations {
    int (*read)(struct file* file, void* buf, uint32_t size, uint64_t offset);
    int (*write)(struct file* file, const void* buf, uint32_t size, uint64_t offset);
    int (*open)(struct inode* inode, struct file* file);
    int (*close)(struct file* file);
} file_ops_t;

typedef struct super_operations {
    struct inode* (*alloc_inode)(struct superblock* sb);
    void (*destroy_inode)(struct inode* inode);
    void (*write_inode)(struct inode* inode);
} super_ops_t;

// ----------------------------------------------------------------------------
// CORE STRUCTURES
// ----------------------------------------------------------------------------

typedef struct inode {
    uint32_t inode_no;
    uint32_t size;
    uint32_t mode; // Permissions and file type (Dir, File, Symlink)
    uint32_t ref_count; // How many processes have this file open?
    
    struct superblock* sb;
    inode_ops_t* i_ops;
    file_ops_t* f_ops;
    
    void* private_data; // Pointer to FS-specific data (e.g., Ext4 extents)
} inode_t;

typedef struct dentry {
    char name[MAX_FILENAME];
    struct inode* d_inode;
    struct dentry* d_parent;
    
    // Links for the Dentry Cache tree
    struct dentry* first_child;
    struct dentry* next_sibling;
} dentry_t;

typedef struct file {
    dentry_t* dentry;
    uint64_t offset;
    uint32_t flags; // O_RDONLY, O_WRONLY
    uint32_t ref_count;
    file_ops_t* f_ops;
} file_t;

typedef struct superblock {
    uint32_t magic;
    uint32_t block_size;
    dentry_t* root_dentry; // The root "/" of this filesystem
    
    super_ops_t* s_ops;
    void* private_data; // Pointer to FS-specific super block
} superblock_t;

// ----------------------------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------------------------

void vfs_init();
int vfs_mount(const char* target_path, superblock_t* sb);
file_t* vfs_open(const char* path, uint32_t flags);
int vfs_read(file_t* file, void* buf, uint32_t size);
int vfs_write(file_t* file, const void* buf, uint32_t size);
void vfs_close(file_t* file);

#endif // VFS_H
