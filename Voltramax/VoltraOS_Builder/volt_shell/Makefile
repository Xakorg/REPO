CC = gcc
CFLAGS = -Wall -Wextra -g -I/usr/include/wlroots -I/usr/include/pixman-1 -I/usr/include/libdrm
LDFLAGS = -lwayland-server -lwlroots -lxkbcommon -lpixman-1

all: voltrashell

voltrashell: voltrashell.c
	$(CC) $(CFLAGS) -o voltrashell voltrashell.c $(LDFLAGS)

clean:
	rm -f voltrashell
