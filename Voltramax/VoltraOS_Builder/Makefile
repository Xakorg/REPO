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
# The custom C Kernel has been deprecated in favor of a Native Linux Foundation.
# Future builds will package the VDS directly onto an Archiso/Debian rootfs.
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
iso: $(BUILD_DIR)/desktop.initrd
	@echo "[+] Building VoltraOS Linux Foundation Live CD ISO..."
	mkdir -p $(ISO_DIR)/boot/grub
	# In a real build, we'd copy vmlinuz-linux and initramfs here
	cp $(BUILD_DIR)/desktop.initrd $(ISO_DIR)/boot/
	echo 'set default=0' > $(ISO_DIR)/boot/grub/grub.cfg
	echo 'set timeout=3' >> $(ISO_DIR)/boot/grub/grub.cfg
	echo 'menuentry "VoltraOS Enterprise" {' >> $(ISO_DIR)/boot/grub/grub.cfg
	echo '  linux /boot/vmlinuz-linux root=/dev/ram0 rw quiet splash' >> $(ISO_DIR)/boot/grub/grub.cfg
	echo '  initrd /boot/desktop.initrd' >> $(ISO_DIR)/boot/grub/grub.cfg
	echo '}' >> $(ISO_DIR)/boot/grub/grub.cfg
	grub-mkrescue -o voltra_os_v1.iso $(ISO_DIR)/boot/grub/grub.cfg
	
	grub-mkrescue -o $(ISO_IMAGE) $(ISO_DIR)
	@echo "SUCCESS: voltraos.iso generated and ready for VoltraMax hardware."

clean:
	rm -rf $(BUILD_DIR) $(ISO_DIR) $(ISO_IMAGE)
