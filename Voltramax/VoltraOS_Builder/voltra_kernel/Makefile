CC = gcc
AS = as --32
CFLAGS = -m32 -fno-pie -std=gnu99 -ffreestanding -O2 -Wall -Wextra -Iinclude
LDFLAGS = -m32 -no-pie -ffreestanding -O2 -nostdlib -lgcc

OBJS = boot.o kernel.o src/vga.o src/ports.o src/string.o src/gdt.o src/gdt_flush.o src/idt.o src/idt_load.o src/isr.o src/interrupt.o src/keyboard.o src/pmm.o src/vmm.o src/heap.o src/pci.o src/timer.o src/ata.o src/vfs.o src/fat32.o src/graphics.o src/font.o src/mouse.o src/window.o src/task.o src/task_switch.o src/syscall.o src/user.o src/tss_flush.o src/elf.o src/rtl8139.o

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
	grub-mkrescue -o voltraos.iso isodir

clean:
	rm -f $(OBJS) voltraos.bin voltraos.iso
	rm -rf isodir
