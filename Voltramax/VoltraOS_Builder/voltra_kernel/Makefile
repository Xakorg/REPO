CC = i686-linux-gnu-gcc
AS = i686-linux-gnu-as
CFLAGS = -std=gnu99 -ffreestanding -O2 -Wall -Wextra -Iinclude
LDFLAGS = -ffreestanding -O2 -nostdlib -lgcc

OBJS = boot.o kernel.o src/vga.o src/ports.o src/string.o src/gdt.o src/gdt_flush.o src/idt.o src/idt_load.o src/isr.o src/interrupt.o src/keyboard.o src/pmm.o src/vmm.o src/heap.o

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
	grub-mkrescue -o voltraos.iso isodir

clean:
	rm -f $(OBJS) voltraos.bin voltraos.iso
	rm -rf isodir
