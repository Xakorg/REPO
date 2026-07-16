#ifndef NET_H
#define NET_H

#include <stdint.h>

// MAC Addresses are 6 bytes long (e.g. 00:1A:2B:3C:4D:5E)
typedef struct {
    uint8_t dest_mac[6];
    uint8_t src_mac[6];
    uint16_t ethertype; // E.g., 0x0800 for IPv4, 0x0806 for ARP
} __attribute__((packed)) ethernet_frame_t;

// IP Addresses are 4 bytes long (e.g. 192.168.1.1)
typedef struct {
    uint8_t version_ihl;
    uint8_t dscp_ecn;
    uint16_t length;
    uint16_t ident;
    uint16_t flags_fragment;
    uint8_t ttl;
    uint8_t protocol;       // 6 = TCP, 17 = UDP, 1 = ICMP (Ping)
    uint16_t checksum;
    uint32_t src_ip;
    uint32_t dest_ip;
} __attribute__((packed)) ipv4_header_t;

// Address Resolution Protocol Packet (ARP)
typedef struct {
    uint16_t htype;
    uint16_t ptype;
    uint8_t hlen;
    uint8_t plen;
    uint16_t opcode;       // 1 = Request, 2 = Reply
    uint8_t sender_mac[6];
    uint32_t sender_ip;
    uint8_t target_mac[6];
    uint32_t target_ip;
} __attribute__((packed)) arp_packet_t;

#endif
