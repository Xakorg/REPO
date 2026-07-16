FROM ubuntu:24.04

# Avoid tzdata interactive prompts hanging the build
ENV DEBIAN_FRONTEND=noninteractive

# Install the 32-bit cross-compiler, GRUB bootloader generators, and ISO tools!
RUN apt-get update && apt-get install -y \
    build-essential \
    nasm \
    grub-pc-bin \
    grub-common \
    xorriso \
    mtools \
    gcc-i686-linux-gnu \
    binutils-i686-linux-gnu \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
