/** Queues remote ICE candidates until setRemoteDescription has completed. */
export class IceCandidateBuffer {
  private queue: RTCIceCandidateInit[] = [];
  private ready = false;

  constructor(private pc: RTCPeerConnection) {}

  markReady() {
    this.ready = true;
    void this.flush();
  }

  reset() {
    this.queue = [];
    this.ready = false;
  }

  async add(init: RTCIceCandidateInit) {
    if (this.ready && this.pc.remoteDescription) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(init));
      } catch (err) {
        console.warn("ICE candidate error:", err);
      }
      return;
    }
    this.queue.push(init);
  }

  private async flush() {
    const pending = [...this.queue];
    this.queue = [];
    for (const init of pending) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(init));
      } catch (err) {
        console.warn("ICE candidate flush error:", err);
      }
    }
  }
}
