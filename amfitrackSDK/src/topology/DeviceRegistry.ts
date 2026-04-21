import { DEVICE_CLEANUP_INTERVAL_MS, DEVICE_TIMEOUT_MS } from "../../config";
import { PayloadType } from "../protocol/AmfitrackDecoder";
import { useDeviceStore } from "../store/useDeviceStore";
import type { DeviceKind } from "../interfaces/IStore";
import { ITransport } from "../interfaces/ITransport";
import { IDeviceRegistry } from "../interfaces/IDeviceRegistry";
import { IConfigurator } from "../interfaces/IConfigurator";
import { ResolvedTransport } from "../interfaces/ISendPipeline";

export class DeviceRegistry implements IDeviceRegistry {
  private checkInterval: number | null = null;
  private TIMEOUT_MS = DEVICE_TIMEOUT_MS;
  private sourceTxIdMap: Map<ITransport, number> = new Map();
  private configurator: IConfigurator;
  private temporaryTxIdCounter = 0;

  constructor(configurator: IConfigurator) {
    this.configurator = configurator;
  }

  public registerSourceOrGetTxId(source: ITransport): number {
    const txId = this.sourceTxIdMap.get(source);
    if (txId) return txId;

    const temporaryTxID = this.generateTemporaryTxId();

    this.sourceTxIdMap.set(source, temporaryTxID);

    // Register the device
    useDeviceStore
      .getState()
      .registerDevice(
        temporaryTxID,
        source.getProductName() as DeviceKind,
        null,
      );

    // Start a background task that fetches the real id and config.
    this.updateDeviceTxIdAndConfig(source, temporaryTxID);

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
      this.updateDeviceConfig(deviceTxId);
      this.startLivenessCheck();
    }
  }

  public resolveTransport(txId: number): ResolvedTransport {
    for (const [transport, id] of this.sourceTxIdMap) {
      if (id === txId) {
        return { transport, deviceTxId: txId };
      }
    }

    const { deviceMeta } = useDeviceStore.getState();
    const meta = deviceMeta[txId];
    if (meta?.readFromTxId != null) {
      for (const [transport, id] of this.sourceTxIdMap) {
        if (id === meta.readFromTxId) {
          return { transport, deviceTxId: txId };
        }
      }
    }

    throw new Error(`No transport found for txId "${txId}"`);
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
        if (!meta) continue;
        if (meta.kind === "hub") continue;
        if (now - meta.lastSeen > this.TIMEOUT_MS) {
          removeDevice(id);
        }
      }
    }, DEVICE_CLEANUP_INTERVAL_MS);
  }

  private generateTemporaryTxId(): number {
    return -++this.temporaryTxIdCounter;
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

  private async updateDeviceTxIdAndConfig(
    device: ITransport,
    temporaryTxId: number,
  ) {
    const configuration = await this.configurator.getConfiguration(device);
    const txId = this.configurator.extractDeviceId(configuration);
    if (txId === null) return;

    useDeviceStore
      .getState()
      .commitSourceTxIdResolution(temporaryTxId, txId, configuration);

    this.sourceTxIdMap.set(device, txId);
  }

  private async updateDeviceConfig(deviceTxId: number) {
    const configuration = await this.configurator.getConfiguration(deviceTxId);
    console.log("configuration", configuration);
    useDeviceStore.getState().updateConfiguration(deviceTxId, configuration);
  }
}
