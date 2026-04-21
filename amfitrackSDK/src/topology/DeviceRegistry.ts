import { DEVICE_CLEANUP_INTERVAL_MS, DEVICE_TIMEOUT_MS } from "../../config";
import { PayloadType } from "../protocol/AmfitrackDecoder";
import { useDeviceStore } from "../store/useDeviceStore";
import type { DeviceKind } from "../interfaces/IStore";
import { ITransport } from "../interfaces/ITransport";
import { IDeviceRegistry } from "../interfaces/IDeviceRegistry";

export class DeviceRegistry implements IDeviceRegistry {
  private checkInterval: number | null = null;
  private TIMEOUT_MS = DEVICE_TIMEOUT_MS;
  private sourceTxIdMap: Map<ITransport, number> = new Map();

  public registerSourceOrGetTxId(source: ITransport): number {
    const txId = this.sourceTxIdMap.get(source);
    if (txId) return txId;

    // Todo: generate a temporary txID
    const temporaryTxID = 123;

    this.sourceTxIdMap.set(source, temporaryTxID);

    // Register the device
    useDeviceStore
      .getState()
      .registerDevice(
        temporaryTxID,
        source.getProductName() as DeviceKind,
        null,
      );

    // Todo: start a background task that fetches the real id and updates it the map.

    return temporaryTxID;
  }

  public pingOrRegisterDevice(
    deviceTxId: number,
    payloadType: PayloadType,
    readFromTxId: number | null,
  ) {
    const { deviceMeta, registerDevice, pingDevice } =
      useDeviceStore.getState();

    if (deviceMeta[deviceTxId]) {
      pingDevice(deviceTxId);
    } else {
      const kind = this.kindFromPayload(payloadType);
      if (!kind) return;
      registerDevice(deviceTxId, kind, readFromTxId);
      this.startLivenessCheck();
    }
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private startLivenessCheck() {
    if (this.checkInterval) return;

    this.checkInterval = window.setInterval(() => {
      const { deviceMeta, removeDevice } = useDeviceStore.getState();
      const now = Date.now();

      for (const txId of Object.keys(deviceMeta)) {
        const id = Number(txId);
        const meta = deviceMeta[id];
        if (meta.kind === "hub") continue;
        if (now - meta.lastSeen > this.TIMEOUT_MS) {
          removeDevice(id);
        }
      }
    }, DEVICE_CLEANUP_INTERVAL_MS);
  }

  private kindFromPayload(payloadType: PayloadType): DeviceKind | null {
    switch (payloadType) {
      case PayloadType.EMF_IMU_FRAME_ID:
        return "sensor";
      case PayloadType.SOURCE_MEASUREMENT:
      case PayloadType.SOURCE_CALIBRATION:
        return "source";
      default:
        return null;
    }
  }
}
