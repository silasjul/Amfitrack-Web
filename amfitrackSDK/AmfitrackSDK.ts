import { IAmfitrackSDK } from "./src/interfaces/IAmfitrackSDK";
import { PRODUCT_ID_SENSOR, PRODUCT_ID_SOURCE, VENDOR_ID } from "./config";
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

/**
 * Big facade pattern that connects everything.
 */
export class AmfitrackSDK implements IAmfitrackSDK {
  private USBConnections: HIDConnection[] = [];
  private decoder: IDecoder = new AmfitrackDecoder();
  private encoder: IEncoder = new AmfitrackEncoder();
  private sendPipeline: ISendPipeline = new SendPipeline(this.encoder);
  private configurator: IConfigurator = new Configurator(this.sendPipeline, this.encoder, this.decoder);
  private deviceRegistry: DeviceRegistry = new DeviceRegistry(this.configurator);

  private readPipeline = new ReadPipeline(this.decoder, this.deviceRegistry);

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

    return true;
  }

  public requestConnectionViaBLE(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  public setParam(
    deviceID: number,
    paramUID: number,
    value: number | boolean | string,
  ): Promise<number | boolean | string> {
    throw new Error("Method not implemented.");
  }

  public initialize(): Promise<void> {
    return Promise.resolve();
  }

  public destroy(): Promise<void> {
    for (const connection of this.USBConnections) {
      connection.stopReading();
    }
    this.USBConnections = [];
    this.deviceRegistry.destroy();
    return Promise.resolve();
  }
}
