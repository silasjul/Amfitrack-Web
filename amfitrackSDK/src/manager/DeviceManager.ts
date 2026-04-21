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
  // Maps a physical transport (e.g. a HID connection) to the TX ID we resolved
  // for it. Initially a negative temporary ID, replaced once we read the real
  // Device ID from the firmware configuration.
  private sourceTxIdMap: Map<ITransport, number> = new Map();
  private configurator: IConfigurator;
  private store: DeviceStoreApi;
  private temporaryTxIdCounter = 0;
  // Sensors that arrived via packets from a hub before their source's real TX
  // ID was resolved -- they can't fetch their config until the hub is known.
  private pendingConfigDevices: Set<number> = new Set();
  // Tombstone map: kind -> (txId -> expiry timestamp). When a device's TX ID
  // is changed, the old ID is retired here for a few seconds so straggler
  // packets don't spawn a ghost entry in the store.
  private retiredTxIds: Map<DeviceKind, Map<number, number>> = new Map();

  constructor(configurator: IConfigurator, store: DeviceStoreApi) {
    this.configurator = configurator;
    this.store = store;
  }

  public async classifyUsbDevice(transport: ITransport): Promise<DeviceKind> {
    // Sources have a unique product ID so we can identify them instantly.
    if (transport.getProductId() === PRODUCT_ID_SOURCE) return "source";

    // For devices on the shared product ID (0x0d12, used by both hubs and
    // sensors), ask the firmware for its name and fall back to checking the
    // configuration category names if that fails.
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

    // Assign a negative temporary ID so we can track packets from this
    // transport immediately while we wait for the real Device ID from firmware.
    const temporaryTxID = this.generateTemporaryTxId();
    this.sourceTxIdMap.set(source, temporaryTxID);

    // Register with a placeholder kind; classifyAndResolveDevice() will replace
    // it with the real TX ID and configuration once the firmware responds.
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
      // Device already known -- just update its last-seen timestamp so the
      // liveness check doesn't remove it.
      pingDevice(deviceTxId);
      return;
    }

    const kind = this.kindFromPayload(payloadType);
    if (!kind) return;

    // Drop packets for tombstoned IDs -- these are old TX IDs that were just
    // changed and will briefly keep broadcasting before the device resets.
    if (this.isTxIdRetired(kind, deviceTxId)) return;

    registerDevice(deviceTxId, kind, readFromTxId);
    if (readFromTxId != null && readFromTxId >= 0) {
      // Device is relayed through a known source -- fetch its config now.
      this.updateDeviceConfig(deviceTxId);
    } else {
      // Source not resolved yet; queue this device and fetch its config once
      // the hub's TX ID is confirmed.
      this.pendingConfigDevices.add(deviceTxId);
    }
    this.startLivenessCheck();
  }

  public resolveTransport(txId: number): ResolvedTransport {
    // Direct match: this TX ID belongs to a physically connected transport.
    for (const [transport, id] of this.sourceTxIdMap) {
      if (id === txId) {
        return { transport, deviceTxId: txId };
      }
    }

    // Indirect match: this device is relayed through a hub. Find the hub's
    // transport using the readFromTxId stored in the device's metadata.
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

  public isDirectlyConnected(txId: number): boolean {
    for (const id of this.sourceTxIdMap.values()) {
      if (id === txId) return true;
    }
    return false;
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

    // Periodically sweep for sensors/sources that have gone silent. Hubs are
    // excluded because they don't broadcast on their own TX ID.
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
      // Tombstone expired -- clean it up automatically.
      kindMap.delete(txId);
      return false;
    }
    return true;
  }

  private generateTemporaryTxId(): number {
    // Negative IDs are guaranteed not to clash with real firmware TX IDs.
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

      // Swap the temporary ID for the real one and attach the full config.
      // Any store entries that referenced the temporary ID are migrated.
      this.store
        .getState()
        .commitSourceTxIdResolution(temporaryTxId, txId, configuration);

      this.sourceTxIdMap.set(device, txId);
      // Now that the hub's real TX ID is known, sensors waiting in
      // pendingConfigDevices can have their configurations fetched.
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

// Check if the firmware device name string indicates its role.
function classifyByName(name: string): DeviceKind | null {
  const normalised = name.toLowerCase();
  if (normalised.includes("hub")) return "hub";
  if (normalised.includes("source")) return "source";
  if (normalised.includes("sensor")) return "sensor";
  return null;
}

// Fall back to scanning configuration category names when the device name
// probe is unavailable or inconclusive.
function classifyByConfiguration(config: Configuration[]): DeviceKind | null {
  for (const category of config) {
    const name = category.name.toLowerCase();
    if (name.includes("hub")) return "hub";
    if (name.includes("sensor")) return "sensor";
    if (name.includes("source")) return "source";
  }
  return null;
}
