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

export class DeviceError extends Error {
  title: string;
  description: string;

  constructor(title: string, description: string) {
    super(`${title}: ${description}`);
    this.name = "DeviceError";
    this.title = title;
    this.description = description;
  }
}

export type DeviceFrequency = {
  totalHz: number;
  byPayloadType: Partial<Record<PayloadType, number>>;
};

export interface AmfitrackEvents {
  hubConnection: (device: HIDDevice, connected: boolean) => void;
  sourceConnection: (device: HIDDevice, connected: boolean) => void;
  reading: (isReading: boolean) => void;
  error: ({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) => void;
  emfImuFrameId: (header: PacketHeader, payload: EmfImuFrameIdData) => void;
  sourceMeasurement: (
    header: PacketHeader,
    payload: SourceMeasurementData,
  ) => void;
  sourceCalibration: (
    header: PacketHeader,
    payload: SourceCalibrationData,
  ) => void;
  messageFrequency: (data: Map<number, DeviceFrequency>) => void;
}

class AmfitrackWeb {
  private _hubDevices = new Set<HIDDevice>();
  private _sourceDevices = new Set<HIDDevice>();
  private _isReading = false;

  private hidManager = new HIDManager();
  private configurator = new Configurator(this.hidManager);
  private emitter = createNanoEvents<AmfitrackEvents>();
  private disconnectHandler: ((e: HIDConnectionEvent) => void) | null = null;

  private packetCounts = new Map<number, Map<PayloadType, number>>();
  private frequencyInterval: ReturnType<typeof setInterval> | null = null;
  private lastFrequencyTime = 0;

  get hubDevices(): ReadonlySet<HIDDevice> {
    return this._hubDevices;
  }
  get sourceDevices(): ReadonlySet<HIDDevice> {
    return this._sourceDevices;
  }
  get isReading(): boolean {
    return this._isReading;
  }

  on<K extends keyof AmfitrackEvents>(event: K, cb: AmfitrackEvents[K]) {
    return this.emitter.on(event, cb);
  }

  async initialize(): Promise<void> {
    this.setupDisconnectHandler();
    await this.autoConnect();
  }

  destroy(): void {
    this.stopReadingAll();
    this.stopFrequencyTracking();
    this.removeDisconnectHandler();
  }

  /**
   * Prompt the user to pick a hub or source device and connect it.
   * Already-connected devices are ignored so the chooser only acts on new ones.
   */
  async requestConnectionDevice(): Promise<HIDDevice | null> {
    const device = await this.hidManager.requestDevice([
      PRODUCT_ID_SENSOR,
      PRODUCT_ID_SOURCE,
    ]);
    if (!device) return null;

    if (device.productId === PRODUCT_ID_SENSOR) {
      if (this._hubDevices.has(device)) return device;
      try {
        await this.startReadingDevice(device);
        this._hubDevices.add(device);
        this.syncConfiguratorHub();
        this.emitter.emit("hubConnection", device, true);
        return device;
      } catch {
        throw new DeviceError(
          "Failed to open hub device",
          "Make sure it is not in use by another program or browser tab.",
        );
      }
    }

    if (device.productId === PRODUCT_ID_SOURCE) {
      if (this._sourceDevices.has(device)) return device;
      try {
        await this.hidManager.openDevice(device);
        this._sourceDevices.add(device);
        this.emitter.emit("sourceConnection", device, true);
        return device;
      } catch {
        throw new DeviceError(
          "Failed to open source device",
          "Make sure it is not in use by another program or browser tab.",
        );
      }
    }

    return null;
  }

  /**
   * Configurations — now accept the specific device to configure.
   */
  async getHubConfiguration(device: HIDDevice) {
    return await this.configurator.getConfigurationUSBDevice(device);
  }

  async getSourceConfiguration(device: HIDDevice) {
    return await this.configurator.getConfigurationUSBDevice(device);
  }

  async getSensorConfiguration(sensorID: number) {
    if (this._hubDevices.size === 0) return null;
    return await this.configurator.getConfigurationSensor(sensorID);
  }

  async setHubParameterValue(
    device: HIDDevice,
    uid: number,
    value: number | boolean | string,
    deviceTxId?: number,
    expectDeviceIdChange?: boolean,
  ): Promise<number | boolean | string> {
    return await this.configurator.setDeviceParameterValue(
      device,
      uid,
      value,
      deviceTxId,
      expectDeviceIdChange,
    );
  }

  async setSourceParameterValue(
    device: HIDDevice,
    uid: number,
    value: number | boolean | string,
    deviceTxId?: number,
    expectDeviceIdChange?: boolean,
  ): Promise<number | boolean | string> {
    return await this.configurator.setDeviceParameterValue(
      device,
      uid,
      value,
      deviceTxId,
      expectDeviceIdChange,
    );
  }

  async setSensorParameterValue(
    sensorID: number,
    uid: number,
    value: number | boolean | string,
    expectSourceIdChange?: boolean,
  ): Promise<number | boolean | string> {
    const hub = this.getPrimaryHub();
    if (!hub) throw new Error("No hub device is connected");
    return await this.configurator.setSensorParameterValue(
      hub,
      sensorID,
      uid,
      value,
      expectSourceIdChange,
    );
  }

  /**
   * Returns the first connected hub, used as the primary hub
   * for sensor configuration requests.
   */
  getPrimaryHub(): HIDDevice | null {
    const first = this._hubDevices.values().next();
    return first.done ? null : first.value;
  }

  /**
   * Private
   */
  private async autoConnect(): Promise<void> {
    const hubs = await this.hidManager.getDevices(VENDOR_ID, PRODUCT_ID_SENSOR);
    for (const hub of hubs) {
      try {
        await this.startReadingDevice(hub);
        this._hubDevices.add(hub);
        this.syncConfiguratorHub();
        this.emitter.emit("hubConnection", hub, true);
      } catch {
        this.emitter.emit("error", {
          title: "Failed to open hub device",
          description:
            "Make sure it is not in use by another program or browser tab.",
        });
      }
    }

    const sources = await this.hidManager.getDevices(
      VENDOR_ID,
      PRODUCT_ID_SOURCE,
    );
    for (const source of sources) {
      try {
        await this.hidManager.openDevice(source);
        this._sourceDevices.add(source);
        this.emitter.emit("sourceConnection", source, true);
      } catch {
        this.emitter.emit("error", {
          title: "Failed to open source device",
          description:
            "Make sure it is not in use by another program or browser tab.",
        });
      }
    }
  }

  private syncConfiguratorHub(): void {
    this.configurator.hubDevice = this.getPrimaryHub();
  }

  private setupDisconnectHandler(): void {
    this.disconnectHandler = (e: HIDConnectionEvent) => {
      const device = e.device;
      if (
        device.productId === PRODUCT_ID_SENSOR &&
        this._hubDevices.has(device)
      ) {
        this._hubDevices.delete(device);
        this.hidManager.stopReadingDevice(device);
        this.syncConfiguratorHub();
        this.updateReadingState();
        this.emitter.emit("hubConnection", device, false);
      }
      if (
        device.productId === PRODUCT_ID_SOURCE &&
        this._sourceDevices.has(device)
      ) {
        this._sourceDevices.delete(device);
        this.emitter.emit("sourceConnection", device, false);
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

  private async startReadingDevice(device: HIDDevice): Promise<void> {
    await this.hidManager.startReadingDevice(device, (bytes) => {
      this.processData(bytes);
    });

    if (!this._isReading) {
      this._isReading = true;
      this.emitter.emit("reading", true);
      this.startFrequencyTracking();
    }
  }

  private stopReadingAll(): void {
    this.hidManager.stopReadingAll();
    this._isReading = false;
    this.emitter.emit("reading", false);
    this.stopFrequencyTracking();
  }

  private updateReadingState(): void {
    if (this._hubDevices.size === 0 && this._isReading) {
      this._isReading = false;
      this.emitter.emit("reading", false);
      this.stopFrequencyTracking();
    }
  }

  private startFrequencyTracking(): void {
    this.stopFrequencyTracking();
    this.lastFrequencyTime = performance.now();
    this.packetCounts.clear();

    this.frequencyInterval = setInterval(() => {
      const now = performance.now();
      const elapsedSec = (now - this.lastFrequencyTime) / 1000;
      if (elapsedSec <= 0) return;

      const result = new Map<number, DeviceFrequency>();
      for (const [txId, typeCounts] of this.packetCounts) {
        let total = 0;
        const byType: Partial<Record<PayloadType, number>> = {};
        for (const [pType, count] of typeCounts) {
          const hz = count / elapsedSec;
          byType[pType] = hz;
          total += hz;
        }
        result.set(txId, { totalHz: total, byPayloadType: byType });
      }

      this.emitter.emit("messageFrequency", result);
      this.packetCounts.clear();
      this.lastFrequencyTime = now;
    }, 200);
  }

  private stopFrequencyTracking(): void {
    if (this.frequencyInterval !== null) {
      clearInterval(this.frequencyInterval);
      this.frequencyInterval = null;
    }
    this.packetCounts.clear();
    this.emitter.emit("messageFrequency", new Map());
  }

  private trackPacket(sourceTxId: number, payloadType: PayloadType): void {
    let typeCounts = this.packetCounts.get(sourceTxId);
    if (!typeCounts) {
      typeCounts = new Map();
      this.packetCounts.set(sourceTxId, typeCounts);
    }
    typeCounts.set(payloadType, (typeCounts.get(payloadType) ?? 0) + 1);
  }

  private processData(bytes: Uint8Array): void {
    const packet = new Packet(bytes);
    const packetDecoder = new PacketDecoder(packet);
    const { value: payloadType } = packetDecoder.getPayloadType();
    const header = packetDecoder.getDecodedHeader();
    const payload = packetDecoder.getDecodedPayload();

    this.trackPacket(header.sourceTxId, payloadType);

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
