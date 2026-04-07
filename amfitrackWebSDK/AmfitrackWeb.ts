import { VENDOR_ID, PRODUCT_ID_SENSOR, PRODUCT_ID_SOURCE } from "./config";
import { PacketDecoder, PacketHeader, PayloadType, PayloadDataMap, DecodedPayload } from "./packets/PacketDecoder";
import { Packet } from "./packets/Packet";
import {
  SourceMeasurementData,
  SourceCalibrationData,
  EmfImuFrameIdData,
} from "./packets/decoders";

class AmfitrackWeb {
  private sensorDevice: HIDDevice | null = null;
  private sourceDevice: HIDDevice | null = null;

  private payloadHandlers: {
    [K in PayloadType]?: (header: PacketHeader, payload: PayloadDataMap[K]) => void;
  } = {};

  public setOnEmfImuFrameId(handler: (header: PacketHeader, payload: EmfImuFrameIdData) => void) {
    this.payloadHandlers[PayloadType.EMF_IMU_FRAME_ID] = handler;
  }
  public setOnSourceMeasurement(handler: (header: PacketHeader, payload: SourceMeasurementData) => void) {
    this.payloadHandlers[PayloadType.SOURCE_MEASUREMENT] = handler;
  }
  public setOnSourceCalibration(handler: (header: PacketHeader, payload: SourceCalibrationData) => void) {
    this.payloadHandlers[PayloadType.SOURCE_CALIBRATION] = handler;
  }

  private inputReportHandler: ((event: HIDInputReportEvent) => void) | null =
    null;
  private openingPromise: Promise<void> | null = null;

  public async requestConnectionHub(): Promise<HIDDevice | null> {
    return this.requestDevice(PRODUCT_ID_SENSOR, (device) => {
      this.sensorDevice = device;
    });
  }

  public async requestConnectionSource(): Promise<HIDDevice | null> {
    return this.requestDevice(PRODUCT_ID_SOURCE, (device) => {
      this.sourceDevice = device;
    });
  }

  private async requestDevice(
    productId: number,
    assign: (device: HIDDevice) => void,
  ): Promise<HIDDevice | null> {
    try {
      const devices = await navigator.hid.requestDevice({
        filters: [{ vendorId: VENDOR_ID, productId }],
      });

      if (devices.length === 0) {
        throw new Error("No device was selected.");
      }

      const device = devices[0];
      assign(device);
      return device;
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        throw new Error("No device was selected.");
      }
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  public async autoConnectAuthorizedDevices(): Promise<HIDDevice[] | null> {
    const devices = await navigator.hid.getDevices();

    const authorizedDevices = devices.filter(
      (d) =>
        d.vendorId === VENDOR_ID &&
        (d.productId === PRODUCT_ID_SENSOR ||
          d.productId === PRODUCT_ID_SOURCE),
    );

    if (authorizedDevices.length > 0) {
      for (const device of authorizedDevices) {
        if (device.productId === PRODUCT_ID_SENSOR) {
          this.sensorDevice = device;
          console.log("Auto-connected to known device:", device.productName);
        } else if (device.productId === PRODUCT_ID_SOURCE) {
          this.sourceDevice = device;
          console.log("Auto-connected to known device:", device.productName);
        }
      }

      return authorizedDevices;
    }

    return null;
  }

  public async disconnect() {
    this.stopReading();

    if (this.sensorDevice?.opened) {
      await this.sensorDevice.close();
    }
    if (this.sourceDevice?.opened) {
      await this.sourceDevice.close();
    }

    this.sensorDevice = null;
    this.sourceDevice = null;
  }

  public async startReading(device: HIDDevice) {
    if (!device) return;

    if (!device.opened) {
      if (!this.openingPromise) {
        this.openingPromise = device.open().finally(() => {
          this.openingPromise = null;
        });
      }
      await this.openingPromise;
    }

    if (this.inputReportHandler) {
      device.removeEventListener("inputreport", this.inputReportHandler);
    }

    this.inputReportHandler = (event: HIDInputReportEvent) => {
      const bytes = new Uint8Array(event.data.buffer);
      this.processData(bytes);
    };

    device.addEventListener("inputreport", this.inputReportHandler);
  }

  public stopReading() {
    if (this.inputReportHandler) {
      this.sensorDevice?.removeEventListener(
        "inputreport",
        this.inputReportHandler,
      );
      this.sourceDevice?.removeEventListener(
        "inputreport",
        this.inputReportHandler,
      );
      this.inputReportHandler = null;
    }
  }

  private processData(bytes: Uint8Array) {
    const packet = new Packet(bytes);
    const packetDecoder = new PacketDecoder(packet);
    const { value: payloadType } = packetDecoder.getPayloadType();
    const header = packetDecoder.getDecodedHeader();
    const payload = packetDecoder.getDecodedPayload();

    const handler = this.payloadHandlers[payloadType];
    (handler as ((header: PacketHeader, payload: DecodedPayload) => void) | undefined)?.(header, payload);
  }
}

export default AmfitrackWeb;
