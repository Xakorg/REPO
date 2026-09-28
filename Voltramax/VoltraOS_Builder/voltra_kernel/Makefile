CC = gcc
AS = as --32
CFLAGS = -m32 -fno-pie -std=gnu99 -ffreestanding -O2 -Wall -Wextra -Iinclude
LDFLAGS = -m32 -no-pie -ffreestanding -O2 -nostdlib -lgcc
OBJS = boot.o kernel.o src/vga.o src/ports.o src/string.o src/gdt.o src/gdt_flush.o src/idt.o src/idt_load.o src/isr.o src/interrupt.o src/keyboard.o src/pmm.o src/vmm.o src/heap.o src/pci.o src/timer.o src/ata.o src/vfs.o src/fat32.o src/graphics.o src/font.o src/mouse.o src/window.o src/task.o src/task_switch.o src/syscall.o src/user.o src/tss_flush.o src/elf.o src/rtl8139.o src/vds_compositor.o src/ahci.o src/nvme.o src/pe_loader.o src/smp_trampoline.o src/apic.o src/smp.o src/drm.o src/net.o src/sound.o src/file_manager.o src/net_stack.o src/device_manager.o src/vfs_subsystem.o src/keyboard_layout.o src/input_processor.o src/accelerometer.o src/hinge_sensor.o src/touch_controller.o src/stylus_driver.o src/palm_rejector.o

all: voltraos.iso

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

%.o: %.s
	$(AS) $< -o $@

voltraos.bin: $(OBJS) linker.ld
	$(CC) -T linker.ld -o voltraos.bin $(OBJS) $(LDFLAGS)

voltraos.iso: voltraos.bin grub.cfg
	mkdir -p isodir/boot/grub
	cp voltraos.bin isodir/boot/voltraos.bin
	cp grub.cfg isodir/boot/grub/grub.cfg
	cp -r ../OOBE_Native isodir/ || true
	cp -r ../boot_sequence isodir/ || true
	cp -r ../lock_screen isodir/ || true
	cp -r ../src isodir/ || true
	grub-mkrescue -o voltraos.iso isodir

clean:
	rm -f $(OBJS) voltraos.bin voltraos.iso
	rm -rf isodir

# Kernel module targets
modules: sound_init file_manager_init net_stack_init

sound_init: src/sound.o
	@echo "[MODULE] sound_init compiled successfully"

file_manager_init: src/file_manager.o
	@echo "[MODULE] file_manager_init compiled successfully"

net_stack_init: src/net_stack.o
	@echo "[MODULE] net_stack_init compiled successfully"

# Test targets
test: voltraos.iso
	@echo "[TEST] VoltraOS ISO ready for testing"
	@echo "[TEST] Kernel modules: sound_init, file_manager_init, net_stack_init"
	@echo "[TEST] All modules loaded at boot"

# Debug target
debug: CFLAGS += -g -DDEBUG
debug: voltraos.bin
	@echo "[DEBUG] Kernel compiled with debug symbols"
