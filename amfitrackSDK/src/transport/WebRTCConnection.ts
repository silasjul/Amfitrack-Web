import {
  ITransport,
  DataCallback,
  DisconnectCallback,
  TransportConnectionKind,
} from "../interfaces/ITransport";

const HANDSHAKE_TIMEOUT_MS = 5000;

type SignalMessage =
  | { type: "answer"; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; candidate: RTCIceCandidateInit | null };

/**
 * Transport that exchanges raw Amfitrack HID frames with the local Node
 * WebRTC bridge (see /webrtc). Uses a WebSocket for signaling and a single
 * RTCDataChannel for the binary packet stream — bidirectional: inbound
 * frames fan out to listeners, writeToDevice sends frames back to the
 * bridge which forwards them to the HID device.
 */
export class WebRTCConnection implements ITransport {
  public readonly id: number;
  private readonly url: string;
  private listeners = new Set<DataCallback>();
  private disconnectCallbacks = new Set<DisconnectCallback>();
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private disconnected = false;
  private handshakeComplete = false;

  constructor(url: string, id: number) {
    this.url = url;
    this.id = id;
  }

  public getPhysicalLinkKey(): string | null {
    return `webrtc:${this.url}`;
  }

  public startReading(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const settle = (err?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (err) reject(err);
        else resolve();
      };

      const timeout = setTimeout(
        () => settle(new Error("WebRTC handshake timeout")),
        HANDSHAKE_TIMEOUT_MS,
      );

      const ws = new WebSocket(this.url);
      this.ws = ws;

      // No STUN: the bridge is on the same LAN (Windows Mobile Hotspot,
      // 192.168.137.0/24) so host candidates are sufficient. Adding STUN can
      // gather srflx candidates via whatever NIC has internet access — when
      // Meta Quest Link is active, that's a virtual interface that can't
      // reach the hotspot subnet, and ICE may end up pairing it.
      const pc = new RTCPeerConnection({ iceServers: [] });
      this.pc = pc;

      // Low-latency channel: real-time sensor data prefers drops over
      // retransmits so the stream doesn't bunch up under packet loss.
      const channel = pc.createDataChannel("amfitrack", {
        ordered: false,
        maxRetransmits: 0,
      });
      channel.binaryType = "arraybuffer";
      this.channel = channel;

      channel.onopen = () => {
        this.handshakeComplete = true;
        settle();
      };
      channel.onerror = (ev) => {
        console.warn("[WebRTCConnection] data channel error", ev);
        settle(new Error("WebRTC data channel error"));
      };
      channel.onclose = () => this.fireDisconnect();

      channel.onmessage = (ev) => {
        let bytes: Uint8Array | null = null;
        if (ev.data instanceof ArrayBuffer) {
          bytes = new Uint8Array(ev.data);
        } else if (ArrayBuffer.isView(ev.data)) {
          const view = ev.data as ArrayBufferView;
          bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
        }
        if (!bytes) return;

        // Bridge forwards node-hid bytes as-is. node-hid prefixes with the
        // HID report ID (0x01) — matching what Chrome's WebHID puts at
        // event.data.buffer[0]. The SDK decoder skips byte 0 via subarray(1,8).
        for (const cb of this.listeners) cb(bytes);
      };

      pc.onicecandidate = ({ candidate }) => {
        if (candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ice", candidate }));
        }
      };

      pc.onconnectionstatechange = () => {
        // "disconnected" is transient (ICE checks failing momentarily) and
        // can recover on its own — only treat the terminal states as a drop.
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          this.fireDisconnect();
        }
      };

      ws.onopen = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(
            JSON.stringify({ type: "offer", sdp: pc.localDescription }),
          );
        } catch (err) {
          settle(err instanceof Error ? err : new Error(String(err)));
        }
      };

      ws.onerror = (ev) => {
        if (!this.handshakeComplete) {
          console.warn("[WebRTCConnection] signaling socket error", ev);
          settle(new Error("WebRTC signaling socket error"));
        }
      };
      ws.onclose = () => {
        // Once the data channel is open WebRTC is fully peer-to-peer; the
        // signaling socket can close without affecting the stream.
        if (!this.handshakeComplete) {
          settle(new Error("WebRTC signaling socket closed"));
          this.fireDisconnect();
        }
      };

      ws.onmessage = async (ev) => {
        try {
          const msg: SignalMessage = JSON.parse(String(ev.data));
          if (msg.type === "answer" && msg.sdp) {
            await pc.setRemoteDescription(msg.sdp);
          } else if (msg.type === "ice" && msg.candidate) {
            await pc.addIceCandidate(msg.candidate);
          }
        } catch (err) {
          console.error("[WebRTCConnection] signaling parse error", err);
        }
      };
    });
  }

  public stopReading(): void {
    if (this.channel) {
      this.channel.onmessage = null;
    }
  }

  public addListener(cb: DataCallback): void {
    this.listeners.add(cb);
  }

  public removeListener(cb: DataCallback): void {
    this.listeners.delete(cb);
  }

  public async disconnect(): Promise<void> {
    if (this.disconnected) return;
    this.disconnected = true;
    this.stopReading();
    this.teardownSockets();
    for (const cb of this.disconnectCallbacks) cb();
    this.disconnectCallbacks.clear();
  }

  public async forget(): Promise<void> {
    /* nothing to revoke — no browser permission grant for WebRTC. */
  }

  public async writeToDevice(bytes: Uint8Array): Promise<void> {
    if (!this.channel || this.channel.readyState !== "open") {
      console.warn(
        "[WebRTCConnection] writeToDevice ignored — channel not open",
      );
      return;
    }
    // Copy into a freshly-allocated ArrayBuffer: satisfies send()'s strict
    // ArrayBufferView<ArrayBuffer> typing (Uint8Array<ArrayBufferLike> isn't
    // assignable) and decouples the wire payload from any later mutation of
    // the caller's buffer.
    const buf = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buf).set(bytes);
    this.channel.send(buf);
  }

  public getProductName(): string {
    return "Amfitrack WebRTC Bridge";
  }

  public getProductId(): number {
    return 0;
  }

  public onDisconnect(cb: DisconnectCallback): void {
    this.disconnectCallbacks.add(cb);
  }

  public getConnectionKind(): TransportConnectionKind {
    return "webrtc";
  }

  private fireDisconnect(): void {
    if (this.disconnected) return;
    this.disconnected = true;
    this.stopReading();
    this.teardownSockets();
    for (const cb of this.disconnectCallbacks) cb();
    this.disconnectCallbacks.clear();
  }

  private teardownSockets(): void {
    try {
      this.channel?.close();
    } catch {
      /* ignore */
    }
    try {
      this.pc?.close();
    } catch {
      /* ignore */
    }
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.channel = null;
    this.pc = null;
    this.ws = null;
  }
}
