import { Device, DeviceKind } from "./Device";
import type { EmfImuFrameIdData } from "../packets/decoders";

/**
 * A Sensor today arrives through hub-forwarded packets only, but the class
 * is modelled with optional USB transport so that a directly-connected
 * Sensor (sharing product id 0x0d12 with the Hub) can be supported in the
 * future without a second refactor.
 */
export class Sensor extends Device {
  public readonly kind: DeviceKind = "sensor";

  public lastFrame: EmfImuFrameIdData | null = null;

  constructor(
    txId: number | null = null,
    hidDevice: HIDDevice | null = null,
  ) {
    super(txId, hidDevice);
  }

  public supportsTimeout(): boolean {
    return true;
  }
}
