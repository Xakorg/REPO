# ==============================================================================
# VOLTRA OS ENTERPRISE - MASSIVE UNIFIED ISO MAKEFILE
# ==============================================================================
# This Makefile combines the Ring 0 C Kernel and the Ring 3 QML Desktop Server
# into a single, bootable voltraos.iso image.
# ==============================================================================

# Tools
CC = gcc -m32 -ffreestanding -O2 -Wall -Wextra
AS = nasm -f elf32
LD = ld -m elf_i386

# Directories
KERNEL_DIR = voltra_kernel
DESKTOP_DIR = desktop_environment
BUILD_DIR = build
ISO_DIR = isodir

# Output
ISO_IMAGE = voltraos.iso

all: iso

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

# ------------------------------------------------------------------------------
# 1. Compile the C Kernel
# ------------------------------------------------------------------------------
$(BUILD_DIR)/boot.o: $(KERNEL_DIR)/src/boot.s | $(BUILD_DIR)
	$(AS) $< -o $@

$(BUILD_DIR)/kernel.o: $(KERNEL_DIR)/src/kernel.c | $(BUILD_DIR)
	$(CC) -c $< -o $@

$(BUILD_DIR)/voltra_kernel.bin: $(BUILD_DIR)/boot.o $(BUILD_DIR)/kernel.o
	$(LD) -T $(KERNEL_DIR)/linker.ld -o $@ $^

# ------------------------------------------------------------------------------
# 2. Compile the User Space Initrd (Desktop Environment + Daemons)
# ------------------------------------------------------------------------------
$(BUILD_DIR)/desktop.initrd:
	@echo "Bundling C++ Daemons and QML files into Initial RAM Disk..."
	mkdir -p $(BUILD_DIR)/initrd_root
	cp -r $(DESKTOP_DIR)/* $(BUILD_DIR)/initrd_root/
	cp -r OOBE_Native/* $(BUILD_DIR)/initrd_root/
	# Create a tarball to act as the massive initrd
	cd $(BUILD_DIR)/initrd_root && tar -cf ../desktop.initrd .

# ------------------------------------------------------------------------------
# 3. Generate the Bootable ISO via GRUB
# ------------------------------------------------------------------------------
iso: $(BUILD_DIR)/voltra_kernel.bin $(BUILD_DIR)/desktop.initrd
	@echo "Building final voltraos.iso..."
	mkdir -p $(ISO_DIR)/boot/grub
	cp $(BUILD_DIR)/voltra_kernel.bin $(ISO_DIR)/boot/
	cp $(BUILD_DIR)/desktop.initrd $(ISO_DIR)/boot/
	
	# Create GRUB Config
	echo 'set timeout=0' > $(ISO_DIR)/boot/grub/grub.cfg
	echo 'set default=0' >> $(ISO_DIR)/boot/grub/grub.cfg
	echo 'menuentry "VoltraOS Enterprise" {' >> $(ISO_DIR)/boot/grub/grub.cfg
	echo '  multiboot /boot/voltra_kernel.bin' >> $(ISO_DIR)/boot/grub/grub.cfg
	echo '  module /boot/desktop.initrd' >> $(ISO_DIR)/boot/grub/grub.cfg
	echo '  boot' >> $(ISO_DIR)/boot/grub/grub.cfg
	echo '}' >> $(ISO_DIR)/boot/grub/grub.cfg
	
	grub-mkrescue -o $(ISO_IMAGE) $(ISO_DIR)
	@echo "SUCCESS: voltraos.iso generated and ready for VoltraMax hardware."

clean:
	rm -rf $(BUILD_DIR) $(ISO_DIR) $(ISO_IMAGE)
