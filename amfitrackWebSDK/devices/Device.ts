/**
 * Amount of time (ms) a non-USB device may go without any hub-forwarded
 * packet before it is considered disconnected.
 */
export const DEVICE_TIMEOUT_MS = 3000;

/**
 * How often the registry evaluates device timeouts.
 */
export const DEVICE_CLEANUP_INTERVAL_MS = 1000;

export type DeviceKind = "hub" | "source" | "sensor";

/**
 * Abstract base for any physical Amfitrack device.
 *
 * A device has two possible transports:
 *  - USB: `hidDevice` is set. Configurator commands go directly over the HID link.
 *  - Hub-forwarded: `hidDevice` is null. The device is observed via packets
 *    relayed by the connected Hub and identified by its `txId`.
 *
 * A device may be transport-less briefly during USB open (before we have
 * read its txId) or during hub bring-up (before the first packet arrives).
 */
export abstract class Device {
  public abstract readonly kind: DeviceKind;

  public txId: number | null;
  public hidDevice: HIDDevice | null;
  public lastSeen: number;

  protected constructor(txId: number | null, hidDevice: HIDDevice | null) {
    this.txId = txId;
    this.hidDevice = hidDevice;
    this.lastSeen = Date.now();
  }

  public touch(now: number = Date.now()): void {
    this.lastSeen = now;
  }

  public isUsbConnected(): boolean {
    return this.hidDevice !== null;
  }

  public hasTimedOut(now: number, timeoutMs: number): boolean {
    if (!this.supportsTimeout()) return false;
    if (this.isUsbConnected()) return false;
    return now - this.lastSeen > timeoutMs;
  }

  /**
   * Whether this device type should be removed after inactivity.
   * Hubs are USB-only and never time out.
   */
  public abstract supportsTimeout(): boolean;
}
