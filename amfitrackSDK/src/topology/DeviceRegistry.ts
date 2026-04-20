import { DEVICE_CLEANUP_INTERVAL_MS, DEVICE_TIMEOUT_MS } from "../../config";
import { PayloadType } from "../protocol/AmfitrackDecoder";
import { useDeviceStore } from "../store/useDeviceStore";
import type { DeviceKind } from "../interfaces/IStore";

export class DeviceRegistry {
  private checkInterval: number | null = null;
  private TIMEOUT_MS = DEVICE_TIMEOUT_MS;

  public registerHub(hubTxId: number) {
    useDeviceStore.getState().registerDevice(hubTxId, "hub", null);
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
