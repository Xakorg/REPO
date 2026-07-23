/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - DIRECT RENDERING MANAGER IMPLEMENTATION
 * ============================================================================
 * 
 * This file implements the core DRM subsystem. 
 * Hardware-specific drivers (like Intel i915 or AMDGPU) register themselves 
 * here. The User Space Window Server (Desktop Daemon) communicates with this 
 * subsystem via ioctl() system calls to request page flips and VRAM allocation.
 * ============================================================================
 */

#include "drm.h"
#include "heap.h"
#include "vmm.h"
#include "vga.h"

#define MAX_DRM_DEVICES 4

drm_device_t* registered_devices[MAX_DRM_DEVICES];
uint32_t num_drm_devices = 0;

// ----------------------------------------------------------------------------
// CORE LOGIC
// ----------------------------------------------------------------------------

void drm_init() {
    num_drm_devices = 0;
    // SLAB cache initialization for DRM objects would go here.
}

int drm_register_device(drm_device_t* dev) {
    if (!dev || num_drm_devices >= MAX_DRM_DEVICES) return -1;
    
    registered_devices[num_drm_devices++] = dev;
    
    // In a real OS, this creates a device node in the VFS (e.g., /dev/dri/card0)
    // so that the User Space compositor can open() and ioctl() it.
    
    return 0;
}

drm_framebuffer_t* drm_alloc_framebuffer(drm_device_t* dev, uint32_t w, uint32_t h, uint32_t bpp) {
    if (!dev || !dev->ops || !dev->ops->alloc_vram) return NULL;
    
    uint32_t pitch = w * (bpp / 8);
    uint32_t size = pitch * h;
    
    // Ask the specific GPU Driver to allocate memory in VRAM
    void* vram_phys = dev->ops->alloc_vram(dev, size);
    if (!vram_phys) return NULL;
    
    // Allocate the metadata structure
    drm_framebuffer_t* fb = (drm_framebuffer_t*)kmalloc(sizeof(drm_framebuffer_t));
    if (!fb) return NULL;
    
    fb->width = w;
    fb->height = h;
    fb->pitch = pitch;
    fb->bpp = bpp;
    fb->phys_addr = (uint64_t)vram_phys;
    fb->dev = dev;
    
    // We must map the physical VRAM into the Virtual Memory space (PML4) 
    // of the Window Server process so it can actually draw pixels to it!
    // For now, we simulate an identity map for the kernel.
    fb->virt_addr = vram_phys; 
    
    return fb;
}

int drm_page_flip(drm_crtc_t* crtc, drm_framebuffer_t* next_fb) {
    if (!crtc || !next_fb) return -1;
    
    drm_device_t* dev = next_fb->dev;
    if (!dev || !dev->ops || !dev->ops->page_flip) return -1;
    
    // The hardware driver handles programming the GPU registers to point 
    // the CRTC at the new physical address of the framebuffer.
    int ret = dev->ops->page_flip(crtc, next_fb);
    
    if (ret == 0) {
        crtc->primary_fb = next_fb;
    }
    
    return ret;
}

// ----------------------------------------------------------------------------
// LEGACY VGA WRAPPER (FALLBACK DRIVER)
// ----------------------------------------------------------------------------
// If no Intel/AMD GPU is found, we wrap the old VGA driver into a DRM driver!

void* fallback_alloc_vram(drm_device_t* dev, uint32_t size) {
    // Return the hardcoded Multiboot framebuffer address
    extern uint32_t *framebuffer;
    return (void*)framebuffer; 
}

int fallback_page_flip(drm_crtc_t* crtc, drm_framebuffer_t* fb) {
    // A raw framebuffer without hardware acceleration can't actually do true 
    // page flipping unless we allocate twice the VRAM and change the y-offset.
    // For this stub, we just accept the flip.
    return 0;
}

drm_driver_ops_t fallback_ops = {
    .modeset = NULL,
    .page_flip = fallback_page_flip,
    .alloc_vram = fallback_alloc_vram
};

drm_device_t fallback_device = {
    .pci_device_id = 0,
    .pci_vendor_id = 0,
    .ops = &fallback_ops,
    .crtc_list = NULL,
    .connector_list = NULL
};

void drm_init_fallback() {
    // If no real GPU driver initialized, register the fallback
    if (num_drm_devices == 0) {
        drm_register_device(&fallback_device);
    }
}
