/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - DIRECT RENDERING MANAGER (DRM)
 * ============================================================================
 * 
 * DESCRIPTION:
 * The original VoltraOS used a basic 2D VGA framebuffer (`graphics.c`). 
 * An Enterprise OS requires a modern Graphics Stack. The Direct Rendering 
 * Manager (DRM) and Kernel Mode Setting (KMS) provide the infrastructure for 
 * hardware-accelerated 3D graphics (OpenGL/Vulkan) and tear-free window 
 * compositing.
 * 
 * CORE CONCEPTS (Inspired by Linux DRM):
 * 1. DRM Device: Represents a physical GPU (e.g., Intel HD, AMD Radeon).
 * 2. CRTC (Cathode Ray Tube Controller): Represents the hardware that reads 
 *    pixels from a framebuffer and sends them to a monitor (display pipeline).
 * 3. Connector: Represents physical outputs (HDMI, DisplayPort).
 * 4. Framebuffer (FB): An allocated block of VRAM containing the pixels.
 * 5. Page Flipping (Double Buffering): The DRM allows the Window Server to 
 *    render to an invisible Back Buffer. When rendering is done, an ioctl() 
 *    flips the CRTC pointer to the Back Buffer during V-Sync, ensuring 
 *    absolutely zero screen tearing.
 * ============================================================================
 */

#ifndef DRM_H
#define DRM_H

#include <stdint.h>
#include <stdbool.h>

// ----------------------------------------------------------------------------
// STRUCTURES
// ----------------------------------------------------------------------------

struct drm_device;
struct drm_crtc;
struct drm_connector;
struct drm_framebuffer;

/**
 * Hardware-Specific Operations provided by the GPU Driver (e.g., AMDGPU, i915).
 */
typedef struct drm_driver_ops {
    int (*modeset)(struct drm_crtc* crtc, uint32_t width, uint32_t height);
    int (*page_flip)(struct drm_crtc* crtc, struct drm_framebuffer* fb);
    void* (*alloc_vram)(struct drm_device* dev, uint32_t size);
} drm_driver_ops_t;

typedef struct drm_device {
    uint32_t pci_device_id;
    uint32_t pci_vendor_id;
    drm_driver_ops_t* ops;
    
    // Master Lists
    struct drm_crtc* crtc_list;
    struct drm_connector* connector_list;
} drm_device_t;

typedef struct drm_framebuffer {
    uint32_t width;
    uint32_t height;
    uint32_t pitch; // Bytes per line
    uint32_t bpp;   // Bits per pixel
    
    uint64_t phys_addr; // Physical VRAM address
    void* virt_addr;    // Virtual address mapped for the Window Server
    
    struct drm_device* dev;
} drm_framebuffer_t;

typedef struct drm_crtc {
    uint32_t id;
    drm_framebuffer_t* primary_fb;
    
    uint32_t current_width;
    uint32_t current_height;
    
    struct drm_crtc* next;
} drm_crtc_t;

typedef struct drm_connector {
    uint32_t id;
    uint32_t type; // e.g., HDMI, DP, eDP
    bool connected;
    
    struct drm_connector* next;
} drm_connector_t;

// ----------------------------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------------------------

void drm_init();

/**
 * @brief Registers a new GPU driver with the DRM subsystem.
 * @param dev The DRM device populated by the PCI driver.
 */
int drm_register_device(drm_device_t* dev);

/**
 * @brief Allocates a new Framebuffer in GPU VRAM (or System RAM for UMA).
 */
drm_framebuffer_t* drm_alloc_framebuffer(drm_device_t* dev, uint32_t w, uint32_t h, uint32_t bpp);

/**
 * @brief Flips the CRTC pointer to a new Framebuffer during the next V-Blank.
 * This is how the Voltra Desktop Compositor achieves tear-free 60fps rendering.
 */
int drm_page_flip(drm_crtc_t* crtc, drm_framebuffer_t* next_fb);

#endif // DRM_H
