import { createNanoEvents } from "nanoevents";
import { VENDOR_ID, PRODUCT_ID_SENSOR, PRODUCT_ID_SOURCE } from "./config";
import {
  PacketDecoder,
  PacketHeader,
  PayloadType,
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

export interface AmfitrackEvents {
  hubConnection: (connected: boolean) => void;
  sourceConnection: (connected: boolean) => void;
  reading: (isReading: boolean) => void;
  emfImuFrameId: (header: PacketHeader, payload: EmfImuFrameIdData) => void;
  sourceMeasurement: (
    header: PacketHeader,
    payload: SourceMeasurementData,
  ) => void;
  sourceCalibration: (
    header: PacketHeader,
    payload: SourceCalibrationData,
  ) => void;
}

class AmfitrackWeb {
  private _hubDevice: HIDDevice | null = null;
  private _sourceDevice: HIDDevice | null = null;
  private _isReading = false;

  private hidManager = new HIDManager();
  private configurator = new Configurator(this.hidManager);
  private emitter = createNanoEvents<AmfitrackEvents>();
  private disconnectHandler: ((e: HIDConnectionEvent) => void) | null = null;

  get hubDevice(): HIDDevice | null {
    return this._hubDevice;
  }
  get sourceDevice(): HIDDevice | null {
    return this._sourceDevice;
  }
  get isReading(): boolean {
    return this._isReading;
  }

  on<K extends keyof AmfitrackEvents>(event: K, cb: AmfitrackEvents[K]) {
    return this.emitter.on(event, cb);
  }

  /**
   * Call on mount — auto-connects previously authorized devices
   * and sets up the HID disconnect listener.
   */
  async initialize(): Promise<void> {
    this.setupDisconnectHandler();
    await this.autoConnect();
  }

  /**
   * Call on unmount — stops reading and removes listeners.
   */
  destroy(): void {
    this.stopReading();
    this.removeDisconnectHandler();
  }

  /**
   * Request connection to a new device
   * (required for unauthorized devices or first-time connections)
   */
  async requestConnectionHub(): Promise<void> {
    const device = await this.hidManager.requestDevice(
      PRODUCT_ID_SENSOR,
      (d) => {
        this._hubDevice = d;
        this.configurator.hubDevice = d;
      },
    );
    if (device) {
      this.emitter.emit("hubConnection", true);
      await this.startReading();
    }
  }

  async requestConnectionSource(): Promise<void> {
    const device = await this.hidManager.requestDevice(
      PRODUCT_ID_SOURCE,
      (d) => {
        this._sourceDevice = d;
      },
    );
    if (device) {
      this.emitter.emit("sourceConnection", true);
    }
  }

  /**
   * Configurations
   */
  async getHubConfiguration() {
    if (!this._hubDevice) return null;
    return await this.configurator.getConfigurationUSBDevice(this._hubDevice);
  }

  async getSourceConfiguration() {
    if (!this._sourceDevice) return null;
    return await this.configurator.getConfigurationUSBDevice(
      this._sourceDevice,
    );
  }

  async getSensorConfiguration(sensorID: number) {
    if (!this._hubDevice) return null;
    return await this.configurator.getConfigurationSensor(sensorID);
  }

  async setHubParameterValue(
    uid: number,
    value: number | boolean | string,
  ): Promise<boolean> {
    if (!this._hubDevice) throw new Error("Hub device is not connected");
    return await this.configurator.setParameterValue(
      this._hubDevice,
      uid,
      value,
    );
  }

  async setSourceParameterValue(
    uid: number,
    value: number | boolean | string,
  ): Promise<boolean> {
    if (!this._sourceDevice) throw new Error("Source device is not connected");
    return await this.configurator.setParameterValue(
      this._sourceDevice,
      uid,
      value,
    );
  }

  async setSensorParameterValue(
    sensorID: number,
    uid: number,
    value: number | boolean | string,
  ): Promise<boolean> {
    if (!this._hubDevice) throw new Error("Hub device is not connected");
    return await this.configurator.setParameterValue(
      this._hubDevice,
      uid,
      value,
      sensorID,
    );
  }

  /**
   * Private
   */
  private async autoConnect(): Promise<void> {
    const hub = await this.hidManager.getDevice(VENDOR_ID, PRODUCT_ID_SENSOR);
    if (hub) {
      this._hubDevice = hub;
      this.configurator.hubDevice = hub;
      this.emitter.emit("hubConnection", true);
      await this.startReading();
    }

    const source = await this.hidManager.getDevice(
      VENDOR_ID,
      PRODUCT_ID_SOURCE,
    );
    if (source) {
      this._sourceDevice = source;
      this.emitter.emit("sourceConnection", true);
    }
  }

  private setupDisconnectHandler(): void {
    this.disconnectHandler = (e: HIDConnectionEvent) => {
      const device = e.device;
      if (
        device.productId === PRODUCT_ID_SENSOR &&
        this._hubDevice === device
      ) {
        this._hubDevice = null;
        this.configurator.hubDevice = null;
        this.stopReading();
        this.emitter.emit("hubConnection", false);
      }
      if (
        device.productId === PRODUCT_ID_SOURCE &&
        this._sourceDevice === device
      ) {
        this._sourceDevice = null;
        this.emitter.emit("sourceConnection", false);
      }
    };
    navigator.hid.addEventListener("disconnect", this.disconnectHandler);
  }

  private removeDisconnectHandler(): void {
    if (this.disconnectHandler) {
      navigator.hid.removeEventListener("disconnect", this.disconnectHandler);
      this.disconnectHandler = null;
    }
  }

  private async startReading(): Promise<void> {
    if (!this._hubDevice || this._isReading) return;
    try {
      await this.hidManager.startReadingDevice(this._hubDevice, (bytes) => {
        this.processData(bytes);
      });
      this._isReading = true;
      this.emitter.emit("reading", true);
    } catch (error) {
      console.error(
        "Failed to open device — it may already be in use by another tab or application:",
        error,
      );
    }
  }

  private stopReading(): void {
    this.hidManager.stopReadingAll();
    this._isReading = false;
    this.emitter.emit("reading", false);
  }

  private processData(bytes: Uint8Array): void {
    const packet = new Packet(bytes);
    const packetDecoder = new PacketDecoder(packet);
    const { value: payloadType } = packetDecoder.getPayloadType();
    const header = packetDecoder.getDecodedHeader();
    const payload = packetDecoder.getDecodedPayload();

    switch (payloadType) {
      case PayloadType.EMF_IMU_FRAME_ID:
        this.emitter.emit(
          "emfImuFrameId",
          header,
          payload as EmfImuFrameIdData,
        );
        break;
      case PayloadType.SOURCE_MEASUREMENT:
        this.emitter.emit(
          "sourceMeasurement",
          header,
          payload as SourceMeasurementData,
        );
        break;
      case PayloadType.SOURCE_CALIBRATION:
        this.emitter.emit(
          "sourceCalibration",
          header,
          payload as SourceCalibrationData,
        );
        break;
    }
  }
}

export default AmfitrackWeb;
