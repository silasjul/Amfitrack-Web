import { IAmfitrackSDK } from "./src/interfaces/IAmfitrackSDK";
import {
  PRODUCT_ID_SENSOR,
  PRODUCT_ID_SOURCE,
  VENDOR_ID,
  DEVICE_ID_PARAM_NAME,
  CONFIG_MODE_PARAM_NAME,
} from "./config";
import { HIDConnection } from "./src/transport/HIDConnection";
import { ReadPipeline } from "./src/pipeline/ReadPipeline";
import { IDecoder } from "./src/interfaces/IDecoder";
import { AmfitrackDecoder } from "./src/protocol/AmfitrackDecoder";
import { DeviceRegistry } from "./src/topology/DeviceRegistry";
import { IConfigurator } from "./src/interfaces/IConfigurator";
import { Configurator } from "./src/commands/Configurator";
import { ISendPipeline } from "./src/interfaces/ISendPipeline";
import { SendPipeline } from "./src/pipeline/SendPipeline";
import { IEncoder } from "./src/interfaces/IEncoder";
import { AmfitrackEncoder } from "./src/protocol/AmfitrackEncoder";
import { useDeviceStore } from "./src/store/useDeviceStore";
import { FrequencyTracker } from "./src/tracking/FrequencyTracker";

/**
 * Big facade pattern that connects everything.
 */
export class AmfitrackSDK implements IAmfitrackSDK {
  private USBConnections: HIDConnection[] = [];
  private decoder: IDecoder = new AmfitrackDecoder();
  private encoder: IEncoder = new AmfitrackEncoder();
  private sendPipeline: ISendPipeline = new SendPipeline(this.encoder);
  private configurator: IConfigurator = new Configurator(
    this.sendPipeline,
    this.encoder,
    this.decoder,
  );
  private deviceRegistry: DeviceRegistry = new DeviceRegistry(
    this.configurator,
  );
  private frequencyTracker: FrequencyTracker = new FrequencyTracker();

  private readPipeline = new ReadPipeline(
    this.decoder,
    this.deviceRegistry,
    this.frequencyTracker,
  );

  constructor() {
    this.sendPipeline.setTransportResolver((txId) =>
      this.deviceRegistry.resolveTransport(txId),
    );
  }

  public async requestConnectionViaUSB(
    productIds: number[] = [PRODUCT_ID_SENSOR, PRODUCT_ID_SOURCE],
  ): Promise<boolean> {
    // This will prompt the user to select a device.
    const devices = await navigator.hid.requestDevice({
      filters: productIds.map((productId) => ({
        vendorId: VENDOR_ID,
        productId,
      })),
    });
    if (devices.length === 0) return false; // User cancelled the selection.
    const device = devices[0];

    const connection = new HIDConnection(device);
    this.USBConnections.push(connection); // A reference for cleanup.

    connection.addListener((bytes) =>
      this.readPipeline.processData(bytes, connection),
    );
    await connection.startReading();
    this.frequencyTracker.start();

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
      const confirmed = await this.configurator.setParameter(
        deviceID,
        paramUID,
        value,
        { alternateSourceTxId: value },
      );
      const newTxId = confirmed as number;
      this.deviceRegistry.remapTxId(deviceID, newTxId);
      useDeviceStore.getState().remapDeviceTxId(deviceID, newTxId);
      await this.deviceRegistry.updateDeviceConfig(newTxId);
      return confirmed;
    }

    if (paramName === CONFIG_MODE_PARAM_NAME) {
      const confirmed = await this.configurator.setParameter(
        deviceID,
        paramUID,
        value,
      );
      await this.deviceRegistry.updateDeviceConfig(deviceID);
      return confirmed;
    }

    const confirmed = await this.configurator.setParameter(
      deviceID,
      paramUID,
      value,
    );
    useDeviceStore.getState().updateParameterValue(deviceID, paramUID, confirmed);
    return confirmed;
  }

  private resolveParameterName(
    deviceID: number,
    paramUID: number,
  ): string | null {
    const meta = useDeviceStore.getState().deviceMeta[deviceID];
    if (!meta?.configuration) return null;
    for (const category of meta.configuration) {
      for (const param of category.parameters) {
        if (param.uid === paramUID) return param.name;
      }
    }
    return null;
  }

  public initialize(): Promise<void> {
    return Promise.resolve();
  }

  public destroy(): Promise<void> {
    this.frequencyTracker.stop();
    for (const connection of this.USBConnections) {
      connection.stopReading();
    }
    this.USBConnections = [];
    this.deviceRegistry.destroy();
    return Promise.resolve();
  }
}
