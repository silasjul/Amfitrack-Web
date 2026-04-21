import { IAmfitrackSDK } from "./src/interfaces/IAmfitrackSDK";
import {
  PRODUCT_ID_SENSOR,
  PRODUCT_ID_SOURCE,
  VENDOR_ID,
  DEVICE_ID_PARAM_NAME,
  CONFIG_MODE_PARAM_NAME,
} from "./config";
import { ITransport } from "./src/interfaces/ITransport";
import { HIDConnection } from "./src/transport/HIDConnection";
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
  private connections: Set<ITransport> = new Set();
  private decoder: IDecoder;
  private encoder: IEncoder;
  private sendPipeline: ISendPipeline;
  private configurator: IConfigurator;
  private deviceManager: IDeviceManager;
  private frequencyTracker: IFrequencyTracker;
  private readPipeline: IReadPipeline;

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
    await this.addTransport(new HIDConnection(devices[0]));
    return true;
  }

  public requestConnectionViaBLE(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  public async setParam(
    deviceID: number,
    paramUID: number,
    value: number | boolean | string,
  ): Promise<number | boolean | string> {
    const paramName = this.resolveParameterName(deviceID, paramUID);

    if (paramName === DEVICE_ID_PARAM_NAME && typeof value === "number") {
      const meta = this.store.getState().deviceMeta[deviceID];
      const kind = meta?.kind ?? "sensor";
      const confirmed = await this.configurator.setParameter(
        deviceID,
        paramUID,
        value,
        { alternateSourceTxId: value },
      );
      const newTxId = confirmed as number;
      this.deviceManager.retireTxId(kind, deviceID, 3000);
      this.deviceManager.clearRetiredTxId(kind, newTxId);

      if (this.store.getState().deviceMeta[newTxId]) {
        this.store.getState().removeDevice(deviceID);
      } else {
        this.deviceManager.remapTxId(deviceID, newTxId);
        this.store.getState().remapDeviceTxId(deviceID, newTxId);
      }

      await this.deviceManager.updateDeviceConfig(newTxId);
      return confirmed;
    }

    if (paramName === CONFIG_MODE_PARAM_NAME) {
      const confirmed = await this.configurator.setParameter(
        deviceID,
        paramUID,
        value,
      );
      await this.deviceManager.updateDeviceConfig(deviceID);
      return confirmed;
    }

    const confirmed = await this.configurator.setParameter(
      deviceID,
      paramUID,
      value,
    );
    this.store.getState().updateParameterValue(deviceID, paramUID, confirmed);
    return confirmed;
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

  public async initialize(): Promise<void> {
    const granted = await navigator.hid.getDevices();
    const relevant = granted.filter(
      (d) =>
        d.vendorId === VENDOR_ID &&
        (d.productId === PRODUCT_ID_SENSOR ||
          d.productId === PRODUCT_ID_SOURCE),
    );

    for (const device of relevant) {
      try {
        await this.addTransport(new HIDConnection(device));
      } catch (err) {
        console.error("Failed to auto-connect device", err);
      }
    }
  }

  public destroy(): Promise<void> {
    this.frequencyTracker.stop();
    for (const connection of this.connections) {
      connection.stopReading();
    }
    this.connections.clear();
    this.deviceManager.destroy();
    this.store.getState().clearAll();
    return Promise.resolve();
  }

  private async addTransport(transport: ITransport): Promise<void> {
    if (this.connections.has(transport)) return;
    this.connections.add(transport);

    transport.addListener((bytes) =>
      this.readPipeline.processData(bytes, transport),
    );

    try {
      await transport.startReading();
    } catch (err) {
      this.connections.delete(transport);
      throw err;
    }

    this.frequencyTracker.start();
  }
}
