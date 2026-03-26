import { VENDOR_ID, PRODUCT_ID_SENSOR, PRODUCT_ID_SOURCE } from "./config";
import { PacketDecoder, PayloadType } from "./packets/PacketDecoder";
import { Packet } from "./packets/Packet";
import {
  SourceMeasurementData,
  SourceCalibrationData,
  EmfImuFrameIdData,
} from "./packets/decoders";

type AmfitrackEventMap = {
  sourceMeasurement: SourceMeasurementData;
  sourceCalibration: SourceCalibrationData;
  emfImuFrameId: EmfImuFrameIdData;
};

class AmfitrackWeb {
  private sensorDevice: HIDDevice | null = null;
  private sourceDevice: HIDDevice | null = null;

  private listeners: { [K in keyof AmfitrackEventMap]: Set<(data: AmfitrackEventMap[K]) => void> } = {
    sourceMeasurement: new Set(),
    sourceCalibration: new Set(),
    emfImuFrameId: new Set(),
  };

  public on<K extends keyof AmfitrackEventMap>(event: K, handler: (data: AmfitrackEventMap[K]) => void): void {
    (this.listeners[event] as Set<(data: AmfitrackEventMap[K]) => void>).add(handler);
  }

  public off<K extends keyof AmfitrackEventMap>(event: K, handler: (data: AmfitrackEventMap[K]) => void): void {
    (this.listeners[event] as Set<(data: AmfitrackEventMap[K]) => void>).delete(handler);
  }

  private emit<K extends keyof AmfitrackEventMap>(event: K, data: AmfitrackEventMap[K]): void {
    (this.listeners[event] as Set<(data: AmfitrackEventMap[K]) => void>).forEach((h) => h(data));
  }

  private inputReportHandler: ((event: HIDInputReportEvent) => void) | null =
    null;

  public async requestConnection(): Promise<HIDDevice | null> {
    try {
      const devices = await navigator.hid.requestDevice({
        filters: [
          { vendorId: VENDOR_ID, productId: PRODUCT_ID_SENSOR },
          { vendorId: VENDOR_ID, productId: PRODUCT_ID_SOURCE },
        ],
      });

      if (devices.length === 0) {
        throw new Error("No device was selected.");
      }

      const device = devices[0];

      if (device.productId === PRODUCT_ID_SENSOR) {
        this.sensorDevice = device;
        console.log("Sensor assigned.");
      } else if (device.productId === PRODUCT_ID_SOURCE) {
        this.sourceDevice = device;
        console.log("Source assigned.");
      } else {
        throw new Error(
          `Unrecognized Amfitrack product ID: ${device.productId}`,
        );
      }

      console.log(device);
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
      await device.open();
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
    const payload = packetDecoder.getDecodedPayload();

    switch (payloadType) {
      case PayloadType.EMF_IMU_FRAME_ID:
        this.emit("emfImuFrameId", payload as EmfImuFrameIdData);
        break;
      case PayloadType.SOURCE_MEASUREMENT:
        this.emit("sourceMeasurement", payload as SourceMeasurementData);
        break;
      case PayloadType.SOURCE_CALIBRATION:
        this.emit("sourceCalibration", payload as SourceCalibrationData);
        break;
    }
  }
}

export default AmfitrackWeb;
