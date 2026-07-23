/**
 * ============================================================================
 * VOLTRA OS ENTERPRISE KERNEL - TCP/IP STACK IMPLEMENTATION
 * ============================================================================
 * 
 * This file processes raw ethernet frames up the protocol stack.
 * 
 * THE SK_BUFF ARCHITECTURE:
 * Copying memory is extremely slow. When a packet arrives, we allocate ONE 
 * `sk_buff` from the SLAB cache. As it traverses up (Ethernet -> IPv4 -> TCP),
 * we simply advance the `data` pointer and cast the headers. 
 * ZERO memory copies occur in the kernel network stack!
 * ============================================================================
 */

#include "net.h"
#include "heap.h"
#include "string.h"
#include "task.h"

// Master list of all open sockets
socket_t* active_sockets = NULL;
spinlock_t socket_list_lock;

// SLAB cache for ultra-fast packet allocation
kmem_cache_t* skb_cache;

// ----------------------------------------------------------------------------
// INTERNAL STACK ROUTING
// ----------------------------------------------------------------------------

// Converts a 16-bit integer from Network Byte Order (Big Endian) to Host (Little Endian)
static inline uint16_t ntohs(uint16_t netshort) {
    return ((netshort & 0xFF) << 8) | ((netshort & 0xFF00) >> 8);
}

/**
 * @brief Routes TCP Segments. Finds the matching Socket and updates the State Machine.
 */
static void net_handle_tcp(sk_buff_t* skb) {
    tcp_header_t* tcp = skb->tcp_header;
    uint16_t dst_port = ntohs(tcp->dst_port);
    
    // Find the socket bound to this port
    spinlock_acquire(&socket_list_lock);
    socket_t* sock = active_sockets;
    while (sock) {
        if (sock->local_port == dst_port) break;
        sock = sock->next;
    }
    spinlock_release(&socket_list_lock);
    
    if (!sock) {
        // No one listening on this port. Send a TCP RST (Reset).
        // [STUB] Send RST logic
        kfree(skb);
        return;
    }
    
    spinlock_acquire(&sock->lock);
    
    // TCP STATE MACHINE LOGIC
    if (sock->state == TCP_LISTEN) {
        // Is this a SYN packet? (Bit 1 in data_offset_flags)
        if (ntohs(tcp->data_offset_flags) & (1 << 1)) {
            // [STUB] 
            // 1. Send SYN-ACK packet back
            // 2. Change state to TCP_SYN_RECV
        }
    } else if (sock->state == TCP_ESTABLISHED) {
        // Enqueue the packet to the socket's receive buffer for sys_recv()
        if (!sock->rx_queue_head) {
            sock->rx_queue_head = skb;
            sock->rx_queue_tail = skb;
        } else {
            sock->rx_queue_tail->next = skb;
            sock->rx_queue_tail = skb;
        }
        skb->next = NULL;
        // Do not free the skb here, the user space app will read it!
        spinlock_release(&sock->lock);
        return; 
    }
    
    spinlock_release(&sock->lock);
    
    // If packet wasn't queued for user space, free the buffer
    kfree(skb);
}

/**
 * @brief Routes IPv4 Packets.
 */
static void net_handle_ipv4(sk_buff_t* skb) {
    ipv4_header_t* ip = skb->ip_header;
    
    // Check if the protocol is TCP (6)
    if (ip->protocol == 6) {
        // Advance data pointer past the IPv4 header
        uint8_t ihl = (ip->version_ihl & 0x0F) * 4; // Header length in bytes
        skb->data += ihl;
        skb->len -= ihl;
        
        skb->tcp_header = (tcp_header_t*)skb->data;
        net_handle_tcp(skb);
    } else {
        // Drop unsupported protocols (UDP, ICMP) for now
        kfree(skb);
    }
}

// ----------------------------------------------------------------------------
// PUBLIC INGEST
// ----------------------------------------------------------------------------

void net_receive_packet(uint8_t* buffer, uint32_t length) {
    if (length < sizeof(eth_header_t)) return;
    
    // 1. Allocate an sk_buff from the SLAB cache (O(1))
    // For Phase 5 stub, we simulate it with kmalloc.
    sk_buff_t* skb = (sk_buff_t*)kmalloc(sizeof(sk_buff_t));
    if (!skb) return;
    
    // 2. Allocate the payload data buffer and copy the raw NIC memory
    skb->head = (uint8_t*)kmalloc(length);
    if (!skb->head) { kfree(skb); return; }
    
    memcpy(skb->head, buffer, length);
    
    skb->data = skb->head;
    skb->len = length;
    skb->next = NULL;
    
    // 3. Process Ethernet Header
    skb->mac_header = (eth_header_t*)skb->data;
    uint16_t ethertype = ntohs(skb->mac_header->ethertype);
    
    // Advance data pointer past ethernet header (14 bytes)
    skb->data += sizeof(eth_header_t);
    skb->len -= sizeof(eth_header_t);
    
    // 4. Route based on Ethertype
    if (ethertype == 0x0800) { // IPv4
        skb->ip_header = (ipv4_header_t*)skb->data;
        net_handle_ipv4(skb);
    } else if (ethertype == 0x0806) { // ARP
        // [STUB] Update ARP Table
        kfree(skb->head);
        kfree(skb);
    } else {
        // Unknown, drop
        kfree(skb->head);
        kfree(skb);
    }
}

// ----------------------------------------------------------------------------
// USER SPACE SOCKET API
// ----------------------------------------------------------------------------

socket_t* sys_socket() {
    socket_t* sock = (socket_t*)kmalloc(sizeof(socket_t));
    if (!sock) return NULL;
    
    sock->fd = 0; // Assigned by VFS file descriptor table
    sock->state = TCP_CLOSED;
    sock->rx_queue_head = NULL;
    sock->rx_queue_tail = NULL;
    spinlock_init(&sock->lock);
    
    // Add to global list
    spinlock_acquire(&socket_list_lock);
    sock->next = active_sockets;
    active_sockets = sock;
    spinlock_release(&socket_list_lock);
    
    return sock;
}

int sys_bind(socket_t* sock, uint32_t ip, uint16_t port) {
    if (!sock) return -1;
    spinlock_acquire(&sock->lock);
    sock->local_ip = ip;
    sock->local_port = port;
    spinlock_release(&sock->lock);
    return 0;
}

int sys_listen(socket_t* sock) {
    if (!sock) return -1;
    spinlock_acquire(&sock->lock);
    sock->state = TCP_LISTEN;
    spinlock_release(&sock->lock);
    return 0;
}
