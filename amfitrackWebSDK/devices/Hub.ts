import { Device, DeviceKind } from "./Device";

/**
 * A Hub is always USB-connected. It acts as the gateway for hub-forwarded
 * Source and Sensor packets, so it never appears on the wire itself and does
 * not use timeout-based liveness.
 */
export class Hub extends Device {
  public readonly kind: DeviceKind = "hub";

  constructor(hidDevice: HIDDevice, txId: number | null = null) {
    super(txId, hidDevice);
  }

  public supportsTimeout(): boolean {
    return false;
  }
}
