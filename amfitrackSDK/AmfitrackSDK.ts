import { IAmfitrackSDK } from "./src/interfaces/IAmfitrackSDK";
import { PRODUCT_ID_SENSOR, PRODUCT_ID_SOURCE, VENDOR_ID } from "./config";
import { HIDConnection } from "./src/transport/HIDConnection";
import { ReadPipeline } from "./src/pipeline/ReadPipeline";
import { IDecoder } from "./src/interfaces/IProtocol";
import { AmfitrackDecoder } from "./src/protocol/AmfitrackDecoder";

/**
 * Big facade pattern that connects everything.
 */
export class AmfitrackSDK implements IAmfitrackSDK {
  private USBConnections: HIDConnection[] = [];
  private decoder: IDecoder = new AmfitrackDecoder();

  private readPipeline = new ReadPipeline(this.decoder);

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
    if (devices.length === 0) return false;

    const connection = new HIDConnection(devices[0]);
    this.USBConnections.push(connection); // A reference for cleanup

    await connection.startReading((bytes) =>
      this.readPipeline.processData(bytes),
    );

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
    return Promise.resolve();
  }
}
