/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - VFS IMPLEMENTATION
 * ============================================================================
 * 
 * This file implements the Virtual File System router and Dentry Cache.
 * ============================================================================
 */

#include "vfs.h"
#include "heap.h"
#include "string.h"

// The Global Root of the entire operating system "/"
dentry_t* vfs_global_root = NULL;

// SLAB Caches for blazing fast VFS allocations
extern kmem_cache_t* inode_cache;
extern kmem_cache_t* dentry_cache;
extern kmem_cache_t* file_cache;

// ----------------------------------------------------------------------------
// PATH RESOLUTION (The Dentry Cache)
// ----------------------------------------------------------------------------

/**
 * @brief Walks the Dentry tree to resolve a string path into a Dentry struct.
 * Uses the ultra-fast Dentry Cache. If the dentry is not found in RAM, 
 * it queries the underlying filesystem's Inode operations to load it from disk.
 */
static dentry_t* resolve_path(const char* path) {
    if (!vfs_global_root || !path) return NULL;
    
    // [STUB]: Path parsing logic (e.g., splitting "/home/xakteir/doc.txt")
    // For Enterprise VoltraOS Phase 3, we simulate a cache hit on the root.
    return vfs_global_root;
}

// ----------------------------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------------------------

void vfs_init() {
    // 1. Initialize SLAB Caches for VFS structures
    // (In a real OS, kmem_cache_create is used here. We assume they exist for now.)
    
    // 2. Create the dummy root dentry (until a real FS mounts over it)
    // vfs_global_root = kmem_cache_alloc(dentry_cache);
    // strcpy(vfs_global_root->name, "/");
}

int vfs_mount(const char* target_path, superblock_t* sb) {
    if (!sb) return -1;
    
    // If mounting root "/"
    if (target_path[0] == '/' && target_path[1] == '\0') {
        vfs_global_root = sb->root_dentry;
        return 0;
    }
    
    // Find the dentry at target_path
    dentry_t* mount_point = resolve_path(target_path);
    if (!mount_point) return -1;
    
    // Overlay the mount point (Link the new Superblock's root dentry here)
    // [STUB]: Enterprise mount namespace logic
    return 0;
}

file_t* vfs_open(const char* path, uint32_t flags) {
    dentry_t* dentry = resolve_path(path);
    if (!dentry || !dentry->d_inode) return NULL;
    
    // Allocate a File struct from the SLAB cache
    // file_t* file = kmem_cache_alloc(file_cache);
    // [STUB]: Simulating kmalloc fallback for Phase 3
    file_t* file = (file_t*)kmalloc(sizeof(file_t));
    if (!file) return NULL;
    
    file->dentry = dentry;
    file->offset = 0;
    file->flags = flags;
    file->ref_count = 1;
    file->f_ops = dentry->d_inode->f_ops;
    
    // Call the specific filesystem's open handler
    if (file->f_ops && file->f_ops->open) {
        if (file->f_ops->open(dentry->d_inode, file) != 0) {
            kfree(file);
            return NULL;
        }
    }
    
    return file;
}

int vfs_read(file_t* file, void* buf, uint32_t size) {
    if (!file || !buf || !file->f_ops || !file->f_ops->read) return -1;
    
    // The VFS routes the read directly to the Ext4/NTFS driver!
    int bytes_read = file->f_ops->read(file, buf, size, file->offset);
    if (bytes_read > 0) {
        file->offset += bytes_read;
    }
    return bytes_read;
}

int vfs_write(file_t* file, const void* buf, uint32_t size) {
    if (!file || !buf || !file->f_ops || !file->f_ops->write) return -1;
    
    int bytes_written = file->f_ops->write(file, buf, size, file->offset);
    if (bytes_written > 0) {
        file->offset += bytes_written;
    }
    return bytes_written;
}

void vfs_close(file_t* file) {
    if (!file) return;
    
    if (file->f_ops && file->f_ops->close) {
        file->f_ops->close(file);
    }
    
    // Free the file structure
    kfree(file);
}
