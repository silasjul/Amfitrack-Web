import {
  DEVICE_CLEANUP_INTERVAL_MS,
  DEVICE_TIMEOUT_MS,
  PRODUCT_ID_SOURCE,
} from "../../config";
import { PayloadType } from "../protocol/AmfitrackDecoder";
import type { DeviceKind, DeviceStoreApi } from "../interfaces/IStore";
import { ITransport } from "../interfaces/ITransport";
import { IDeviceManager } from "../interfaces/IDeviceManager";
import type { Configuration, IConfigurator } from "../interfaces/IConfigurator";
import { ResolvedTransport } from "../interfaces/ISendPipeline";

export class DeviceManager implements IDeviceManager {
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private TIMEOUT_MS = DEVICE_TIMEOUT_MS;
  private sourceTxIdMap: Map<ITransport, number> = new Map();
  private configurator: IConfigurator;
  private store: DeviceStoreApi;
  private temporaryTxIdCounter = 0;
  private pendingConfigDevices: Set<number> = new Set();
  private retiredTxIds: Map<DeviceKind, Map<number, number>> = new Map();

  constructor(configurator: IConfigurator, store: DeviceStoreApi) {
    this.configurator = configurator;
    this.store = store;
  }

  public async classifyUsbDevice(transport: ITransport): Promise<DeviceKind> {
    if (transport.getProductId() === PRODUCT_ID_SOURCE) return "source";

    try {
      const name = await this.configurator.getDeviceName(transport);
      const kind = classifyByName(name);
      if (kind) return kind;
    } catch {
      // Name probe failed -- fall through to config probe.
    }

    try {
      const config = await this.configurator.getConfiguration(transport);
      const kind = classifyByConfiguration(config);
      if (kind) return kind;
    } catch {
      // Config probe failed -- fall through to default.
    }

    console.warn("Could not determine role of USB device; defaulting to hub.");
    return "hub";
  }

  public registerSourceOrGetTxId(source: ITransport): number {
    const txId = this.sourceTxIdMap.get(source);
    if (txId) return txId;

    const temporaryTxID = this.generateTemporaryTxId();
    this.sourceTxIdMap.set(source, temporaryTxID);

    // Register with a placeholder kind; the background task will resolve
    // the real kind, tx id, and configuration.
    this.store.getState().registerDevice(temporaryTxID, "hub", null);
    this.classifyAndResolveDevice(source, temporaryTxID);

    return temporaryTxID;
  }

  public pingOrRegisterDevice(
    deviceTxId: number,
    payloadType: PayloadType,
    readFromTxId: number | null,
  ) {
    const { deviceMeta, registerDevice, pingDevice } = this.store.getState();

    if (deviceMeta[deviceTxId]) {
      pingDevice(deviceTxId);
      return;
    }

    const kind = this.kindFromPayload(payloadType);
    if (!kind) return;
    if (this.isTxIdRetired(kind, deviceTxId)) return;

    registerDevice(deviceTxId, kind, readFromTxId);
    if (readFromTxId != null && readFromTxId >= 0) {
      this.updateDeviceConfig(deviceTxId);
    } else {
      this.pendingConfigDevices.add(deviceTxId);
    }
    this.startLivenessCheck();
  }

  public resolveTransport(txId: number): ResolvedTransport {
    for (const [transport, id] of this.sourceTxIdMap) {
      if (id === txId) {
        return { transport, deviceTxId: txId };
      }
    }

    const { deviceMeta } = this.store.getState();
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

  public retireTxId(kind: DeviceKind, txId: number, durationMs: number): void {
    let kindMap = this.retiredTxIds.get(kind);
    if (!kindMap) {
      kindMap = new Map();
      this.retiredTxIds.set(kind, kindMap);
    }
    kindMap.set(txId, Date.now() + durationMs);
  }

  public clearRetiredTxId(kind: DeviceKind, txId: number): void {
    this.retiredTxIds.get(kind)?.delete(txId);
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private startLivenessCheck() {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      const { deviceMeta, removeDevice } = this.store.getState();
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

  private isTxIdRetired(kind: DeviceKind, txId: number): boolean {
    const kindMap = this.retiredTxIds.get(kind);
    if (!kindMap) return false;
    const expiry = kindMap.get(txId);
    if (expiry === undefined) return false;
    if (Date.now() >= expiry) {
      kindMap.delete(txId);
      return false;
    }
    return true;
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

  private async classifyAndResolveDevice(
    device: ITransport,
    temporaryTxId: number,
  ) {
    try {
      const configuration = await this.configurator.getConfiguration(device);
      const txId = this.configurator.extractDeviceId(configuration);
      if (txId === null) return;

      this.store
        .getState()
        .commitSourceTxIdResolution(temporaryTxId, txId, configuration);

      this.sourceTxIdMap.set(device, txId);
      this.flushPendingConfigs();
    } catch (err) {
      console.error(
        `Failed to resolve device config for temp ID ${temporaryTxId}`,
        err,
      );
    }
  }

  private flushPendingConfigs() {
    for (const deviceTxId of this.pendingConfigDevices) {
      this.pendingConfigDevices.delete(deviceTxId);
      const meta = this.store.getState().deviceMeta[deviceTxId];
      if (!meta?.configuration) {
        this.updateDeviceConfig(deviceTxId);
      }
    }
  }

  public async updateDeviceConfig(deviceTxId: number) {
    try {
      const configuration =
        await this.configurator.getConfiguration(deviceTxId);
      this.store.getState().updateConfiguration(deviceTxId, configuration);
    } catch (err) {
      console.error(`Failed to fetch config for device ${deviceTxId}`, err);
    }
  }

  public remapTxId(oldTxId: number, newTxId: number) {
    for (const [transport, id] of this.sourceTxIdMap) {
      if (id === oldTxId) {
        this.sourceTxIdMap.set(transport, newTxId);
        break;
      }
    }
  }
}

function classifyByName(name: string): DeviceKind | null {
  const normalised = name.toLowerCase();
  if (normalised.includes("hub")) return "hub";
  if (normalised.includes("source")) return "source";
  if (normalised.includes("sensor")) return "sensor";
  return null;
}

function classifyByConfiguration(config: Configuration[]): DeviceKind | null {
  for (const category of config) {
    const name = category.name.toLowerCase();
    if (name.includes("hub")) return "hub";
    if (name.includes("sensor")) return "sensor";
    if (name.includes("source")) return "source";
  }
  return null;
}
