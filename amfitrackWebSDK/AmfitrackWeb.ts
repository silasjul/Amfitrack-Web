import { VENDOR_ID, PRODUCT_ID_SENSOR, PRODUCT_ID_SOURCE } from "./config";
import {
  PacketDecoder,
  PacketHeader,
  PayloadType,
  PayloadDataMap,
  DecodedPayload,
} from "./packets/PacketDecoder";
import { Packet } from "./packets/Packet";
import {
  SourceMeasurementData,
  SourceCalibrationData,
  EmfImuFrameIdData,
} from "./packets/decoders";
import HIDManager from "./HIDManager";
import { Configurator } from "./Configurator";

class AmfitrackWeb {
  private sensorDevice: HIDDevice | null = null;
  private sourceDevice: HIDDevice | null = null;

  private hidManager = new HIDManager();
  private configurator = new Configurator(this.hidManager);

  /**
   * Request connection to a new device
   *
   * (this is required for unauthorized devices or first time connections to a device)
   */
  public async requestConnectionHub(): Promise<HIDDevice | null> {
    return this.hidManager.requestDevice(PRODUCT_ID_SENSOR, (device) => {
      this.sensorDevice = device;
    });
  }

  public async requestConnectionSource(): Promise<HIDDevice | null> {
    return this.hidManager.requestDevice(PRODUCT_ID_SOURCE, (device) => {
      this.sourceDevice = device;
    });
  }

  /**
   * Getting authorized devices (only works with previously connected devices)
   *
   * used for auto-connecting devices
   */
  public async getHubDevice(): Promise<HIDDevice | null> {
    this.sensorDevice = await this.hidManager.getDevice(
      VENDOR_ID,
      PRODUCT_ID_SENSOR,
    );
    return this.sensorDevice;
  }

  public async getSourceDevice(): Promise<HIDDevice | null> {
    this.sourceDevice = await this.hidManager.getDevice(
      VENDOR_ID,
      PRODUCT_ID_SOURCE,
    );
    return this.sourceDevice;
  }

  /**
   * Start/stop reading data from devices
   */
  public async startReadingDevice(device: HIDDevice) {
    this.hidManager.startReadingDevice(device, (bytes) => {
      this.processData(bytes);
    });
  }

  public stopReading() {
    this.hidManager.stopReadingAll();
  }

  /**
   * Process data from devices
   */
  private payloadHandlers: {
    [K in PayloadType]?: (
      header: PacketHeader,
      payload: PayloadDataMap[K],
    ) => void;
  } = {};

  public setOnEmfImuFrameId(
    handler: (header: PacketHeader, payload: EmfImuFrameIdData) => void,
  ) {
    this.payloadHandlers[PayloadType.EMF_IMU_FRAME_ID] = handler;
  }
  public setOnSourceMeasurement(
    handler: (header: PacketHeader, payload: SourceMeasurementData) => void,
  ) {
    this.payloadHandlers[PayloadType.SOURCE_MEASUREMENT] = handler;
  }
  public setOnSourceCalibration(
    handler: (header: PacketHeader, payload: SourceCalibrationData) => void,
  ) {
    this.payloadHandlers[PayloadType.SOURCE_CALIBRATION] = handler;
  }

  private processData(bytes: Uint8Array) {
    const packet = new Packet(bytes);
    const packetDecoder = new PacketDecoder(packet);
    const { value: payloadType } = packetDecoder.getPayloadType();
    const header = packetDecoder.getDecodedHeader();
    const payload = packetDecoder.getDecodedPayload();

    const handler = this.payloadHandlers[payloadType];
    (
      handler as
        | ((header: PacketHeader, payload: DecodedPayload) => void)
        | undefined
    )?.(header, payload);
  }

  /**
   * Configurations
   */
  public async getCategoryCount(): Promise<number | null> {
    if (!this.sourceDevice) {
      console.log("No source device");
      return null;
    }
    const result = await this.configurator.getCategoryCount(this.sourceDevice);
    console.log("Category count:", result);
    return result;
  }
}

export default AmfitrackWeb;
