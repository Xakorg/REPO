/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - TCP/IP NETWORK STACK
 * ============================================================================
 * 
 * DESCRIPTION:
 * For VoltraOS to be a 5-star OS supporting XakChat WebSockets and WebRTC, 
 * the kernel must process raw ethernet frames into TCP streams natively.
 * 
 * CORE ABSTRACTIONS (Berkeley Sockets Model):
 * 1. Network Buffers (sk_buff): Every incoming/outgoing packet is wrapped in a 
 *    structure that tracks pointers to the MAC, IP, and TCP headers without 
 *    needing to constantly copy memory.
 * 2. Protocol Layers: Ethernet (L2) -> IPv4/ARP (L3) -> TCP/UDP (L4).
 * 3. Socket API: User space programs open an AF_INET socket. The kernel 
 *    maintains a TCP State Machine (SYN_SENT, ESTABLISHED, FIN_WAIT) for it.
 * ============================================================================
 */

#ifndef NET_H
#define NET_H

#include <stdint.h>
#include <stdbool.h>
#include "smp.h"

// ----------------------------------------------------------------------------
// PACKET HEADERS (Big-Endian Network Byte Order)
// ----------------------------------------------------------------------------

#pragma pack(push, 1)

typedef struct eth_header {
    uint8_t dst_mac[6];
    uint8_t src_mac[6];
    uint16_t ethertype; // e.g., 0x0800 for IPv4, 0x0806 for ARP
} eth_header_t;

typedef struct ipv4_header {
    uint8_t version_ihl;
    uint8_t dscp_ecn;
    uint16_t total_length;
    uint16_t identification;
    uint16_t flags_fragment;
    uint8_t ttl;
    uint8_t protocol; // e.g., 6 for TCP, 17 for UDP
    uint16_t header_checksum;
    uint32_t src_ip;
    uint32_t dst_ip;
} ipv4_header_t;

typedef struct tcp_header {
    uint16_t src_port;
    uint16_t dst_port;
    uint32_t seq_num;
    uint32_t ack_num;
    uint16_t data_offset_flags; // Contains SYN, ACK, FIN, RST, PSH flags
    uint16_t window_size;
    uint16_t checksum;
    uint16_t urgent_pointer;
} tcp_header_t;

#pragma pack(pop)

// ----------------------------------------------------------------------------
// SOCKET STRUCTURES
// ----------------------------------------------------------------------------

// TCP States
#define TCP_CLOSED       0
#define TCP_LISTEN       1
#define TCP_SYN_SENT     2
#define TCP_SYN_RECV     3
#define TCP_ESTABLISHED  4
#define TCP_FIN_WAIT1    5

/**
 * The Network Buffer (sk_buff in Linux).
 * Pre-allocated via the SLAB Allocator (heap.c).
 */
typedef struct sk_buff {
    struct sk_buff* next;
    
    uint8_t* head; // Start of allocated memory
    uint8_t* data; // Current payload pointer (moves as headers are stripped)
    uint32_t len;  // Length of valid data
    
    eth_header_t* mac_header;
    ipv4_header_t* ip_header;
    tcp_header_t* tcp_header;
} sk_buff_t;

/**
 * The Kernel Socket representing an endpoint of communication.
 */
typedef struct socket {
    uint32_t fd;
    uint32_t state;
    
    uint32_t local_ip;
    uint16_t local_port;
    
    uint32_t remote_ip;
    uint16_t remote_port;
    
    uint32_t next_seq;
    uint32_t expected_ack;
    
    sk_buff_t* rx_queue_head;
    sk_buff_t* rx_queue_tail;
    
    spinlock_t lock; // SMP Lock for this specific socket
    struct socket* next;
} socket_t;

// ----------------------------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------------------------

void net_init();

/**
 * @brief Core packet ingest function. Network Interface Cards (NICs) like 
 * rtl8139.c call this during their interrupt handler when a packet arrives.
 */
void net_receive_packet(uint8_t* buffer, uint32_t length);

/**
 * @brief User-Space Socket API
 */
socket_t* sys_socket();
int sys_bind(socket_t* sock, uint32_t ip, uint16_t port);
int sys_listen(socket_t* sock);
socket_t* sys_accept(socket_t* sock);
int sys_connect(socket_t* sock, uint32_t ip, uint16_t port);
int sys_send(socket_t* sock, const void* buf, uint32_t len);
int sys_recv(socket_t* sock, void* buf, uint32_t len);

#endif // NET_H
