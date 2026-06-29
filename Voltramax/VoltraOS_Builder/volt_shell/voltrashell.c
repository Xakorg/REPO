#include <stdio.h>
#include <stdlib.h>
#include <wayland-server-core.h>
#include <wlr/backend.h>
#include <wlr/render/allocator.h>
#include <wlr/render/wlr_renderer.h>
#include <wlr/types/wlr_cursor.h>
#include <wlr/types/wlr_output_layout.h>
#include <wlr/util/log.h>

// ⚡ VOLT SHELL 
// The core Wayland compositor for VoltraOS.
// This is NOT a web app. This is the bare-metal C code that talks directly 
// to the Linux kernel, the GPU, and the hardware inputs.

int main(int argc, char **argv) {
    wlr_log_init(WLR_DEBUG, NULL);
    wlr_log(WLR_INFO, "Starting Volt Shell for VoltraOS...");

    // 1. Create the Wayland display server
    struct wl_display *display = wl_display_create();
    
    // 2. Create the backend (Hooks directly into Linux DRM/KMS for raw GPU access)
    struct wlr_backend *backend = wlr_backend_autocreate(wl_display_get_event_loop(display), NULL);
    if (!backend) {
        wlr_log(WLR_ERROR, "Failed to create wlr_backend. Are you running on bare metal?");
        return 1;
    }

    // 3. Create the renderer (This is where the Vulkan Weather Wallpaper hooks in)
    struct wlr_renderer *renderer = wlr_renderer_autocreate(backend);
    wlr_renderer_init_wl_display(renderer, display);

    // 4. Start the backend
    if (!wlr_backend_start(backend)) {
        wlr_log(WLR_ERROR, "Failed to start Volt Shell backend");
        wlr_backend_destroy(backend);
        wl_display_destroy(display);
        return 1;
    }

    wlr_log(WLR_INFO, "Volt Shell is running natively on Wayland! ⚡");

    // 5. Run the infinite OS event loop
    wl_display_run(display);

    // Cleanup
    wl_display_destroy_clients(display);
    wlr_backend_destroy(backend);
    wl_display_destroy(display);
    return 0;
}
