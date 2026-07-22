#include "vds_compositor.h"
#include "heap.h"       // For kmalloc/kfree
#include "graphics.h"   // For get_lfb() and screen dimensions
#include "string.h"     // For memcpy/memset

// ----------------------------------------------------------------------------
// Voltra Display Server (VDS) - Kernel Compositor Implementation
// ----------------------------------------------------------------------------

// The linked list of all active window surfaces, sorted back-to-front by z-index
static vds_surface_t* surface_list_head = NULL;
static vds_surface_t* surface_list_tail = NULL;
static uint32_t next_surface_id = 1;

// The global master backbuffer (to prevent screen tearing). We composite everything
// here first, then blast it to the hardware LFB in one go.
static uint32_t* global_backbuffer = NULL;
static uint32_t screen_w = 0;
static uint32_t screen_h = 0;

void vds_init(void) {
    screen_w = get_screen_width();
    screen_h = get_screen_height();
    
    // Allocate massive continuous kernel memory for the global compositing buffer
    // Example: 1920x1080 * 4 bytes per pixel = ~8.2MB
    global_backbuffer = (uint32_t*)kmalloc(screen_w * screen_h * sizeof(uint32_t));
    if (!global_backbuffer) {
        // FATAL KERNEL PANIC
        return;
    }
    
    // Clear screen to black
    memset(global_backbuffer, 0, screen_w * screen_h * sizeof(uint32_t));
}

vds_surface_t* vds_create_surface(uint32_t width, uint32_t height, int32_t x, int32_t y, uint32_t flags) {
    vds_surface_t* surf = (vds_surface_t*)kmalloc(sizeof(vds_surface_t));
    if (!surf) return NULL;
    
    surf->id = next_surface_id++;
    surf->width = width;
    surf->height = height;
    surf->x = x;
    surf->y = y;
    surf->flags = flags | VDS_FLAG_DIRTY;
    surf->z_index = 0; // Will be properly sorted on insert
    
    // Allocate pixel buffers
    uint32_t buf_size = width * height * sizeof(uint32_t);
    surf->back_buffer = (uint32_t*)kmalloc(buf_size);
    surf->front_buffer = (uint32_t*)kmalloc(buf_size);
    
    memset(surf->back_buffer, 0, buf_size);
    memset(surf->front_buffer, 0, buf_size);
    
    // Insert into linked list (front of screen by default)
    surf->next = NULL;
    surf->prev = surface_list_tail;
    
    if (surface_list_tail) {
        surface_list_tail->next = surf;
    } else {
        surface_list_head = surf;
    }
    surface_list_tail = surf;
    
    return surf;
}

void vds_destroy_surface(vds_surface_t* surface) {
    if (!surface) return;
    
    // Remove from linked list
    if (surface->prev) surface->prev->next = surface->next;
    else surface_list_head = surface->next;
    
    if (surface->next) surface->next->prev = surface->prev;
    else surface_list_tail = surface->prev;
    
    // Free massive memory chunks
    if (surface->back_buffer) kfree(surface->back_buffer);
    if (surface->front_buffer) kfree(surface->front_buffer);
    kfree(surface);
}

// Highly optimized bitwise alpha blending
inline uint32_t vds_alpha_blend(uint32_t fg, uint32_t bg) {
    uint32_t alpha = (fg >> 24) & 0xFF;
    if (alpha == 255) return fg;
    if (alpha == 0) return bg;
    
    uint32_t inv_alpha = 255 - alpha;
    
    uint32_t r = (((fg >> 16) & 0xFF) * alpha + ((bg >> 16) & 0xFF) * inv_alpha) / 255;
    uint32_t g = (((fg >> 8) & 0xFF) * alpha + ((bg >> 8) & 0xFF) * inv_alpha) / 255;
    uint32_t b = ((fg & 0xFF) * alpha + (bg & 0xFF) * inv_alpha) / 255;
    
    return (0xFF << 24) | (r << 16) | (g << 8) | b;
}

// The core algorithm: Compositing the entire desktop
void vds_composite_frame(void) {
    if (!global_backbuffer) return;
    
    // 1. Draw the absolute base layer (Wallpaper / Solid Color)
    // For now, we fill it with a transparent dark grey to represent the desktop
    for (uint32_t i = 0; i < screen_w * screen_h; i++) {
        global_backbuffer[i] = 0xFF1A1A1A; // ARGB
    }
    
    // 2. Iterate through all surfaces back-to-front (Painter's Algorithm)
    vds_surface_t* curr = surface_list_head;
    while (curr) {
        if (curr->flags & VDS_FLAG_HIDDEN) {
            curr = curr->next;
            continue;
        }
        
        // 3. Blit the surface onto the global backbuffer
        for (uint32_t sy = 0; sy < curr->height; sy++) {
            int32_t dest_y = curr->y + sy;
            if (dest_y < 0 || dest_y >= (int32_t)screen_h) continue; // Y-Clipping
            
            for (uint32_t sx = 0; sx < curr->width; sx++) {
                int32_t dest_x = curr->x + sx;
                if (dest_x < 0 || dest_x >= (int32_t)screen_w) continue; // X-Clipping
                
                uint32_t pixel = curr->front_buffer[sy * curr->width + sx];
                uint32_t dest_idx = dest_y * screen_w + dest_x;
                
                if (curr->flags & VDS_FLAG_ALPHA_BLEND) {
                    global_backbuffer[dest_idx] = vds_alpha_blend(pixel, global_backbuffer[dest_idx]);
                } else {
                    // Ignore alpha, pure overwrite (extremely fast)
                    global_backbuffer[dest_idx] = pixel;
                }
            }
        }
        
        // Clear dirty flag after composite
        curr->flags &= ~VDS_FLAG_DIRTY;
        curr = curr->next;
    }
    
    // 4. Page Flip! Copy the global backbuffer to the hardware LFB
    uint32_t* hardware_lfb = (uint32_t*)get_lfb();
    if (hardware_lfb) {
        // Use fast memory copy (or DMA if hardware supports it)
        memcpy(hardware_lfb, global_backbuffer, screen_w * screen_h * sizeof(uint32_t));
    }
}
