# VoltraPlay ARM64 Kernel Makefile
# We use the aarch64 cross-compiler toolchain

CC = aarch64-linux-gnu-gcc
LD = aarch64-linux-gnu-ld
OBJCOPY = aarch64-linux-gnu-objcopy

CFLAGS = -Wall -O2 -ffreestanding -nostdlib -mgeneral-regs-only -Iinclude
LDFLAGS = -T linker.ld -nostdlib

# Source files
OBJS = boot/boot.o src/uart.o src/kernel.o

# The final binary file
TARGET = voltrakernel8.elf
BIN = voltrakernel8.bin

all: $(BIN)

# Compile Assembly
boot/boot.o: boot/boot.S
	$(CC) $(CFLAGS) -c $< -o $@

# Compile C
src/%.o: src/%.c
	$(CC) $(CFLAGS) -c $< -o $@

# Link everything together
$(TARGET): $(OBJS)
	$(LD) $(LDFLAGS) $(OBJS) -o $(TARGET)

# Extract raw binary for booting
$(BIN): $(TARGET)
	$(OBJCOPY) -O binary $(TARGET) $(BIN)

clean:
	rm -f boot/*.o src/*.o $(TARGET) $(BIN)

# Run the kernel inside the QEMU emulator
qemu: $(BIN)
	qemu-system-aarch64 -M virt -cpu cortex-a57 -nographic -kernel $(TARGET)
