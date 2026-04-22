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
  private transportTxIdMap: Map<ITransport, number> = new Map();
  private configurator: IConfigurator;
  private store: DeviceStoreApi;
  private temporaryTxIdCounter = 0;
  private pendingConfigDevices: Set<number> = new Set();
  private retiredTxIds: Map<DeviceKind, Map<number, number>> = new Map();

  constructor(configurator: IConfigurator, store: DeviceStoreApi) {
    this.configurator = configurator;
    this.store = store;
  }

  // ---------------------------------------------------------------------------
  // Transport registration
  // ---------------------------------------------------------------------------

  public registerTransportOrGetTxId(transport: ITransport): number {
    const existing = this.transportTxIdMap.get(transport);
    if (existing !== undefined) return existing;

    const temporaryTxId = this.generateTemporaryTxId();
    this.transportTxIdMap.set(transport, temporaryTxId);

    this.store
      .getState()
      .registerDevice(temporaryTxId, "unknown", transport.getConnectionKind());
    this.resolveDeviceConfig(transport, temporaryTxId);

    return temporaryTxId;
  }

  public unregisterTransport(transport: ITransport): void {
    const txId = this.transportTxIdMap.get(transport);
    this.transportTxIdMap.delete(transport);
    if (txId === undefined) return;

    const { deviceMeta, removeDevice } = this.store.getState();

    removeDevice(txId);

    for (const key of Object.keys(deviceMeta)) {
      const id = Number(key);
      if (deviceMeta[id]?.uplink === txId) {
        removeDevice(id);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Device discovery (packet-driven)
  // ---------------------------------------------------------------------------

  public pingOrRegisterDevice(
    deviceTxId: number,
    payloadType: PayloadType,
    uplink: number | null,
  ) {
    const { deviceMeta, registerDevice, pingDevice } = this.store.getState();

    if (deviceMeta[deviceTxId]) {
      pingDevice(deviceTxId);
      return;
    }

    const kind = this.kindFromPayload(payloadType);
    if (!kind) return;

    if (this.isTxIdRetired(kind, deviceTxId)) return;

    registerDevice(deviceTxId, kind, uplink);
    if (uplink != null && uplink >= 0) {
      this.fetchDeviceConfig(deviceTxId);
    } else {
      this.pendingConfigDevices.add(deviceTxId);
    }
    this.startLivenessCheck();
  }

  // ---------------------------------------------------------------------------
  // Transport → TX ID resolution (for sending commands)
  // ---------------------------------------------------------------------------

  public resolveTransport(txId: number): ResolvedTransport {
    for (const [transport, id] of this.transportTxIdMap) {
      if (id === txId) {
        return { transport, deviceTxId: txId };
      }
    }

    const { deviceMeta } = this.store.getState();
    const meta = deviceMeta[txId];
    if (typeof meta?.uplink === "number") {
      for (const [transport, id] of this.transportTxIdMap) {
        if (id === meta.uplink) {
          return { transport, deviceTxId: txId };
        }
      }
    }

    throw new Error(`No transport found for txId "${txId}"`);
  }

  // ---------------------------------------------------------------------------
  // Frequency de-duplication
  // ---------------------------------------------------------------------------

  public isDirectlyConnected(txId: number): boolean {
    const meta = this.store.getState().deviceMeta[txId];
    return meta?.uplink === "usb" || meta?.uplink === "ble";
  }

  // ---------------------------------------------------------------------------
  // TX ID tombstoning (for device-ID changes)
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // TX ID remapping
  // ---------------------------------------------------------------------------

  public remapTxId(oldTxId: number, newTxId: number) {
    for (const [transport, id] of this.transportTxIdMap) {
      if (id === oldTxId) {
        this.transportTxIdMap.set(transport, newTxId);
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  public async fetchDeviceConfig(deviceTxId: number) {
    try {
      const configuration =
        await this.configurator.getConfiguration(deviceTxId);
      console.log(`configuration ID_${deviceTxId}`, configuration);
      this.store.getState().updateConfiguration(deviceTxId, configuration);
    } catch (err) {
      console.error(`Failed to fetch config for device ${deviceTxId}`, err);
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private startLivenessCheck() {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      const { deviceMeta, removeDevice } = this.store.getState();
      const now = Date.now();

      for (const txId of Object.keys(deviceMeta)) {
        const id = Number(txId);
        const meta = deviceMeta[id];
        if (!meta) continue;
        // Transport placeholders (hub / unknown) are not swept by liveness —
        // they're only removed when the transport itself disconnects.
        if (meta.kind === "hub" || meta.kind === "unknown") continue;
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

  /**
   * Fetch config from a newly connected transport, classify the device,
   * extract the device ID, and migrate the temporary store entry to the
   * real TX ID with the correct kind.
   */
  private async resolveDeviceConfig(device: ITransport, temporaryTxId: number) {
    try {
      const kind = await this.classifyDevice(device);
      const configuration = await this.configurator.getConfiguration(device);
      const txId = this.configurator.extractDeviceId(configuration);
      console.log(`configuration ID_${txId} (${kind})`, configuration);
      if (txId === null) return;

      this.store
        .getState()
        .commitTransportTxIdResolution(
          temporaryTxId,
          txId,
          configuration,
          kind,
        );

      this.transportTxIdMap.set(device, txId);
    } catch (err) {
      console.warn(
        `Could not resolve device config for temp ID ${temporaryTxId} — ` +
          `streaming data will still flow.`,
        err,
      );
    } finally {
      this.flushPendingConfigs();
    }
  }

  private async classifyDevice(transport: ITransport): Promise<DeviceKind> {
    if (transport.getProductId() === PRODUCT_ID_SOURCE) return "source";

    try {
      const name = await this.configurator.getDeviceName(transport);
      const kind = classifyByName(name);
      if (kind) return kind;
    } catch (err) {
      // Name probe failed — fall through to default.
      console.warn(`Could not classify device`, err);
    }

    return "unknown";
  }

  private flushPendingConfigs() {
    for (const deviceTxId of this.pendingConfigDevices) {
      this.pendingConfigDevices.delete(deviceTxId);
      const meta = this.store.getState().deviceMeta[deviceTxId];
      if (!meta?.configuration) {
        this.fetchDeviceConfig(deviceTxId);
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
