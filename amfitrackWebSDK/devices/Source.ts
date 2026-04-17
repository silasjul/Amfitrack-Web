import { Device, DeviceKind } from "./Device";
import type {
  SourceMeasurementData,
  SourceCalibrationData,
} from "../packets/decoders";

/**
 * A Source can be reached either directly over USB or via hub-forwarded
 * packets. When a USB transport is available Configurator commands are
 * issued directly; otherwise the Source is purely observed through the Hub.
 */
export class Source extends Device {
  public readonly kind: DeviceKind = "source";

  public lastMeasurement: SourceMeasurementData | null = null;
  public lastCalibration: SourceCalibrationData | null = null;

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
