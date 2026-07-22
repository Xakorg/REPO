#ifndef VDS_COMPOSITOR_H
#define VDS_COMPOSITOR_H

#include <stdint.h>
#include <stddef.h>

// ----------------------------------------------------------------------------
// Voltra Display Server (VDS) - Kernel Compositor Header
// ----------------------------------------------------------------------------

#define VDS_FLAG_ALPHA_BLEND  0x01
#define VDS_FLAG_ALWAYS_TOP   0x02
#define VDS_FLAG_HIDDEN       0x04
#define VDS_FLAG_DIRTY        0x08  // Only redraw if dirty

// A Rect structure for clipping calculations
typedef struct {
    int32_t x;
    int32_t y;
    int32_t width;
    int32_t height;
} vds_rect_t;

// A Window Surface. Every GUI app running gets one of these allocated in kernel memory.
typedef struct vds_surface {
    uint32_t id;
    int32_t x;
    int32_t y;
    uint32_t width;
    uint32_t height;
    
    uint32_t z_index;
    uint32_t flags;
    
    // The shared memory buffer mapped to user-space where the app draws
    uint32_t* back_buffer;
    
    // The kernel's cached copy of the window pixels
    uint32_t* front_buffer;

    struct vds_surface* next;
    struct vds_surface* prev;
} vds_surface_t;

// ----------------------------------------------------------------------------
// Compositor API
// ----------------------------------------------------------------------------

void vds_init(void);

// Surface Management
vds_surface_t* vds_create_surface(uint32_t width, uint32_t height, int32_t x, int32_t y, uint32_t flags);
void vds_destroy_surface(vds_surface_t* surface);
void vds_move_surface(vds_surface_t* surface, int32_t x, int32_t y);
void vds_set_z_index(vds_surface_t* surface, uint32_t z);

// Rendering Engine
void vds_mark_dirty(vds_surface_t* surface, vds_rect_t* rect);
void vds_composite_frame(void);

// Utility Math
uint32_t vds_alpha_blend(uint32_t fg, uint32_t bg);
int vds_rect_intersect(vds_rect_t* a, vds_rect_t* b, vds_rect_t* out);

#endif // VDS_COMPOSITOR_H
