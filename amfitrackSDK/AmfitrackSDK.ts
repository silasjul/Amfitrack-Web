import { IAmfitrackSDK, SetParamResult } from "./src/interfaces/IAmfitrackSDK";
import {
  PRODUCT_ID_SENSOR,
  PRODUCT_ID_SOURCE,
  VENDOR_ID,
  DEVICE_ID_PARAM_NAME,
  CONFIG_MODE_PARAM_NAME,
  AMFITRACK_SERVICE_UUID,
  BLUETOOTH_NAME_FILTER,
  DEVICE_POLL_INTERVAL_MS,
} from "./config";
import { ITransport } from "./src/interfaces/ITransport";
import { HIDConnection } from "./src/transport/HIDConnection";
import { BLEConnection } from "./src/transport/BLEConnection";
import { IReadPipeline } from "./src/interfaces/IReadPipeline";
import { ReadPipeline } from "./src/pipeline/ReadPipeline";
import { IDecoder } from "./src/interfaces/IDecoder";
import { AmfitrackDecoder } from "./src/protocol/AmfitrackDecoder";
import { IDeviceManager } from "./src/interfaces/IDeviceManager";
import { DeviceManager } from "./src/manager/DeviceManager";
import { IConfigurator } from "./src/interfaces/IConfigurator";
import { Configurator } from "./src/commands/Configurator";
import { ISendPipeline } from "./src/interfaces/ISendPipeline";
import { SendPipeline } from "./src/pipeline/SendPipeline";
import { IEncoder } from "./src/interfaces/IEncoder";
import { AmfitrackEncoder } from "./src/protocol/AmfitrackEncoder";
import { useDeviceStore } from "./src/store/useDeviceStore";
import type { DeviceStoreApi } from "./src/interfaces/IStore";
import { IFrequencyTracker } from "./src/interfaces/IFrequencyTracker";
import { FrequencyTracker } from "./src/tracking/FrequencyTracker";

/**
 * Facade that wires all SDK subsystems together.
 */
export class AmfitrackSDK implements IAmfitrackSDK {
  private store: DeviceStoreApi;
  private connections: Map<string, ITransport> = new Map();
  private nextTransportId = 0;
  private decoder: IDecoder;
  private encoder: IEncoder;
  private sendPipeline: ISendPipeline;
  private configurator: IConfigurator;
  private deviceManager: IDeviceManager;
  private frequencyTracker: IFrequencyTracker;
  private readPipeline: IReadPipeline;

  // Polling for previously-granted devices
  private hidPollTimer: ReturnType<typeof setInterval> | null = null;
  private knownHIDDevices = new WeakSet<HIDDevice>();

  constructor(store: DeviceStoreApi = useDeviceStore) {
    this.store = store;
    this.decoder = new AmfitrackDecoder();
    this.encoder = new AmfitrackEncoder();
    this.sendPipeline = new SendPipeline(this.encoder);
    this.configurator = new Configurator(
      this.sendPipeline,
      this.encoder,
      this.decoder,
    );
    this.deviceManager = new DeviceManager(this.configurator, this.store);
    this.frequencyTracker = new FrequencyTracker(this.store);
    this.readPipeline = new ReadPipeline(
      this.decoder,
      this.store,
      this.deviceManager,
      this.frequencyTracker,
    );

    this.sendPipeline.setTransportResolver((txId) =>
      this.deviceManager.resolveTransport(txId),
    );
  }

  public async requestConnectionViaUSB(
    productIds: number[] = [PRODUCT_ID_SENSOR, PRODUCT_ID_SOURCE],
  ): Promise<boolean> {
    const devices = await navigator.hid.requestDevice({
      filters: productIds.map((productId) => ({
        vendorId: VENDOR_ID,
        productId,
      })),
    });
    if (devices.length === 0) return false;
    await this.addTransport(
      new HIDConnection(devices[0], this.allocateTransportId()),
    );
    return true;
  }

  public async requestConnectionViaBLE(): Promise<boolean> {
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { namePrefix: BLUETOOTH_NAME_FILTER },
        { services: [AMFITRACK_SERVICE_UUID] },
      ],
      optionalServices: [AMFITRACK_SERVICE_UUID],
    });
    if (!device) return false;
    await this.addTransport(
      new BLEConnection(device, this.allocateTransportId()),
    );
    return true;
  }

  public async disconnectDevice(txId: number): Promise<void> {
    const { transport } = this.deviceManager.resolveTransport(txId);
    await transport.disconnect();
    await transport.forget();
  }

  public async setParam(
    deviceID: number,
    paramUID: number,
    value: number | boolean | string,
  ): Promise<SetParamResult> {
    const paramName = this.resolveParameterName(deviceID, paramUID);

    if (paramName === DEVICE_ID_PARAM_NAME && typeof value === "number") {
      const meta = this.store.getState().deviceMeta[deviceID];
      const kind = meta?.kind ?? "sensor";

      // alternateSourceTxId tells the send pipeline to also listen on the new
      // TX ID for the reply, because the device starts broadcasting under its
      // new ID immediately after the change is applied.
      const confirmed = await this.configurator.setParameter(
        deviceID,
        paramUID,
        value,
        { alternateSourceTxId: value },
      );
      const newTxId = confirmed as number;

      // Tombstone the old ID for 3 seconds so straggler packets that still
      // carry the old TX ID don't resurrect a ghost entry in the store.
      this.deviceManager.retireTxId(kind, deviceID, 3000);
      // Clear any tombstone on the new ID in case it was previously retired.
      this.deviceManager.clearRetiredTxId(kind, newTxId);

      if (this.store.getState().deviceMeta[newTxId]) {
        // The new TX ID already appeared in the store (a packet arrived before
        // the reply came back). Transfer the old configuration so the UI stays
        // populated instead of flashing a loading skeleton.
        const oldConfig =
          this.store.getState().deviceMeta[deviceID]?.configuration;
        if (
          oldConfig &&
          !this.store.getState().deviceMeta[newTxId]?.configuration
        ) {
          this.store.getState().updateConfiguration(newTxId, oldConfig);
        }
        this.store.getState().removeDevice(deviceID);
      } else {
        this.deviceManager.remapTxId(deviceID, newTxId);
        this.store.getState().remapDeviceTxId(deviceID, newTxId);
      }

      this.store.getState().updateParameterValue(newTxId, paramUID, confirmed);
      // Background refresh — the config tree itself hasn't changed, so we
      // don't need to block the caller waiting for it.
      this.deviceManager.updateDeviceConfig(newTxId);

      return { value: confirmed, txIdChanged: newTxId };
    }

    if (paramName === CONFIG_MODE_PARAM_NAME) {
      const confirmed = await this.configurator.setParameter(
        deviceID,
        paramUID,
        value,
      );
      // Config mode changes can add/remove parameter categories, so we need
      // to refresh the whole configuration tree.
      await this.deviceManager.updateDeviceConfig(deviceID);
      return { value: confirmed, configInvalidated: true };
    }

    const confirmed = await this.configurator.setParameter(
      deviceID,
      paramUID,
      value,
    );
    this.store.getState().updateParameterValue(deviceID, paramUID, confirmed);
    return { value: confirmed };
  }

  private resolveParameterName(
    deviceID: number,
    paramUID: number,
  ): string | null {
    const meta = this.store.getState().deviceMeta[deviceID];
    if (!meta?.configuration) return null;
    for (const category of meta.configuration) {
      for (const param of category.parameters) {
        if (param.uid === paramUID) return param.name;
      }
    }
    return null;
  }

  public initialize(): void {
    this.hidPollTimer = setInterval(
      () => this.pollGrantedHIDDevices(),
      DEVICE_POLL_INTERVAL_MS,
    );
    this.pollGrantedHIDDevices();
  }

  private async pollGrantedHIDDevices(): Promise<void> {
    try {
      const granted = await navigator.hid.getDevices();
      const relevant = granted.filter(
        (d) =>
          d.vendorId === VENDOR_ID &&
          (d.productId === PRODUCT_ID_SENSOR ||
            d.productId === PRODUCT_ID_SOURCE),
      );
      for (const device of relevant) {
        if (this.knownHIDDevices.has(device)) continue;
        this.knownHIDDevices.add(device);
        try {
          // Wait for 500ms to allow the device to be fully initialized
          setTimeout(async () => {
            await this.addTransport(
              new HIDConnection(device, this.allocateTransportId()),
            );
          }, 500);
        } catch {
          this.knownHIDDevices.delete(device);
        }
      }
    } catch {
      // HID API unavailable or permission revoked -- nothing to do.
    }
  }

  public destroy(): Promise<void> {
    if (this.hidPollTimer) clearInterval(this.hidPollTimer);
    this.hidPollTimer = null;

    this.frequencyTracker.stop();
    for (const connection of this.connections.values()) {
      connection.stopReading();
    }
    this.connections.clear();
    this.deviceManager.destroy();
    this.store.getState().clearAll();
    return Promise.resolve();
  }

  private allocateTransportId(): number {
    this.nextTransportId += 1;
    return this.nextTransportId;
  }

  private async addTransport(transport: ITransport): Promise<void> {
    const key = transport.getPhysicalLinkKey() ?? String(transport.id);
    if (this.connections.has(key)) return;
    this.connections.set(key, transport);

    transport.addListener((bytes) =>
      this.readPipeline.processData(bytes, transport),
    );

    try {
      await transport.startReading();
    } catch (err) {
      this.connections.delete(key);
      throw err;
    }

    transport.onDisconnect(() => {
      this.connections.delete(key);
      this.deviceManager.unregisterTransport(transport);
    });

    // Register after startReading so the transport is open and ready for
    // classifyAndResolveDevice to send commands.
    this.deviceManager.registerTransportOrGetTxId(transport);

    this.frequencyTracker.start();
  }
}
