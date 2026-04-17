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
import DeviceRegistry, { UsbRole } from "./DeviceRegistry";
import {
  Device,
  Hub,
  Sensor,
  Source,
  DEVICE_TIMEOUT_MS,
  DEVICE_CLEANUP_INTERVAL_MS,
} from "./devices";

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
  deviceAdded: (device: Device) => void;
  deviceRemoved: (device: Device) => void;
  deviceUpdated: (device: Device) => void;
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
  private _isReading = false;

  private hidManager = new HIDManager();
  private configurator = new Configurator(this.hidManager);
  private emitter = createNanoEvents<AmfitrackEvents>();
  private registry: DeviceRegistry;

  private disconnectHandler: ((e: HIDConnectionEvent) => void) | null = null;
  private livenessInterval: ReturnType<typeof setInterval> | null = null;

  private packetCounts = new Map<number, Map<PayloadType, number>>();
  private frequencyInterval: ReturnType<typeof setInterval> | null = null;
  private lastFrequencyTime = 0;

  constructor() {
    this.registry = new DeviceRegistry(this.configurator, {
      onAdded: (device) => this.handleDeviceAdded(device),
      onRemoved: (device) => this.handleDeviceRemoved(device),
      onUpdated: (device) => this.emitter.emit("deviceUpdated", device),
    });
  }

  get devices(): ReadonlyArray<Device> {
    return this.registry.all();
  }
  get isReading(): boolean {
    return this._isReading;
  }

  on<K extends keyof AmfitrackEvents>(event: K, cb: AmfitrackEvents[K]) {
    return this.emitter.on(event, cb);
  }

  async initialize(): Promise<void> {
    this.setupDisconnectHandler();
    this.startLivenessTracking();
    await this.autoConnect();
  }

  destroy(): void {
    this.stopReadingAll();
    this.stopFrequencyTracking();
    this.stopLivenessTracking();
    this.removeDisconnectHandler();
    this.registry.clear();
  }

  /**
   * Prompt the user to pick a hub, source, or sensor device over USB and
   * bring it up. Already-known devices are ignored so the chooser only acts
   * on new ones.
   */
  async requestConnectionDevice(): Promise<HIDDevice | null> {
    const device = await this.hidManager.requestDevice([
      PRODUCT_ID_SENSOR,
      PRODUCT_ID_SOURCE,
    ]);
    if (!device) return null;

    if (this.registry.findByHidDevice(device)) return device;

    await this.bringUpUsbDevice(device);
    return device;
  }

  /**
   * Attach a freshly-discovered txId to a USB-connected device. Called from
   * hooks after they read the device's configuration (so we don't duplicate
   * that I/O inside the SDK). For hub-forwarded Sources we also tombstone
   * the previous id so straggler packets can't spawn a phantom entry.
   */
  setDeviceTxId(device: Device, txId: number): void {
    const previousTxId = device.txId;
    this.registry.setTxId(device, txId);
    if (
      previousTxId !== null &&
      previousTxId !== txId &&
      (device.kind === "source" || device.kind === "sensor")
    ) {
      this.registry.retireTxId(device.kind, previousTxId, 3000);
    }
    this.registry.clearRetiredTxId(device.kind, txId);
  }

  /**
   * Rename a wireless sensor after a successful Device ID write.
   *
   * Handles two races that happen when the device changes id mid-push:
   * 1. A fresh `Sensor(newTxId)` may already exist because hub-forwarded
   *    frames started arriving with the new id before the reply landed.
   *    In that case we drop the stale old entry instead of the live one,
   *    so the UI state we just set isn't clobbered by a `deviceRemoved`
   *    fired against the new id.
   * 2. Straggler packets with the *old* id may still be in transit. We
   *    tombstone the old id for a short grace window so those packets are
   *    discarded on ingress instead of spawning a phantom sensor whose
   *    config fetch would time out.
   */
  renameSensor(oldTxId: number, newTxId: number): void {
    if (oldTxId === newTxId) return;

    const oldSensor = this.registry.findByTxId("sensor", oldTxId);
    const newSensor = this.registry.findByTxId("sensor", newTxId);

    if (oldSensor && newSensor && oldSensor !== newSensor) {
      this.registry.removeDevice(oldSensor);
    } else if (oldSensor) {
      this.registry.setTxId(oldSensor, newTxId);
    }

    this.registry.retireTxId("sensor", oldTxId, 3000);
    this.registry.clearRetiredTxId("sensor", newTxId);
  }

  /* ---------------- Configuration helpers ---------------- */

  async getHubConfiguration(device: HIDDevice) {
    return await this.configurator.getConfigurationUSBDevice(device);
  }

  /**
   * Read a source's full configuration. Uses USB directly when the source is
   * plugged in, or routes through the primary hub via the source's txId when
   * the source is only known through hub-forwarded packets.
   */
  async getSourceConfiguration(source: Source) {
    if (source.hidDevice) {
      return await this.configurator.getConfigurationUSBDevice(
        source.hidDevice,
      );
    }
    const hub = this.getPrimaryHub();
    if (!hub || source.txId === null) return null;
    return await this.configurator.getConfigurationSensor(hub, source.txId);
  }

  async getSensorConfiguration(sensorID: number) {
    const hub = this.getPrimaryHub();
    if (!hub) return null;
    return await this.configurator.getConfigurationSensor(hub, sensorID);
  }

  /**
   * Read a USB-plugged sensor's full configuration directly over its HID
   * transport, bypassing the hub-routed path. Returns null if the sensor
   * has no USB transport (hub-forwarded sensors must use
   * `getSensorConfiguration(sensorID)` instead).
   */
  async getSensorConfigurationFromUsb(sensor: Sensor) {
    if (!sensor.hidDevice) return null;
    return await this.configurator.getConfigurationUSBDevice(sensor.hidDevice);
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

  /**
   * Write a parameter on a source. Uses USB when plugged in, otherwise routes
   * the command through the primary hub using the source's txId.
   */
  async setSourceParameterValue(
    source: Source,
    uid: number,
    value: number | boolean | string,
    expectDeviceIdChange?: boolean,
  ): Promise<number | boolean | string> {
    if (source.hidDevice) {
      return await this.configurator.setDeviceParameterValue(
        source.hidDevice,
        uid,
        value,
        source.txId ?? undefined,
        expectDeviceIdChange,
      );
    }
    const hub = this.getPrimaryHub();
    if (!hub) throw new Error("No hub device is connected");
    if (source.txId === null)
      throw new Error("Source txId unknown; cannot route via hub");
    return await this.configurator.setSensorParameterValue(
      hub,
      source.txId,
      uid,
      value,
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
   * Returns the first connected hub's HIDDevice, used as the primary hub
   * for sensor configuration requests.
   */
  getPrimaryHub(): HIDDevice | null {
    const hub = this.registry.allHubs()[0];
    return hub?.hidDevice ?? null;
  }

  /* ---------------- Private: connection flow ---------------- */

  private async autoConnect(): Promise<void> {
    const hidDevices = [
      ...(await this.hidManager.getDevices(VENDOR_ID, PRODUCT_ID_SENSOR)),
      ...(await this.hidManager.getDevices(VENDOR_ID, PRODUCT_ID_SOURCE)),
    ];

    for (const hid of hidDevices) {
      await this.bringUpUsbDevice(hid);
    }
  }

  /**
   * Open a USB device, classify its role, register it, and (for hubs) start
   * continuous reading. The hook layer drives configuration reads and pushes
   * the resolved txId back via `setDeviceTxId`, so we don't duplicate that
   * I/O here.
   */
  private async bringUpUsbDevice(hidDevice: HIDDevice): Promise<void> {
    try {
      await this.hidManager.openDevice(hidDevice);
    } catch {
      this.emitter.emit("error", {
        title: "Failed to open device",
        description:
          "Make sure it is not in use by another program or browser tab.",
      });
      return;
    }

    let role: UsbRole;
    try {
      role = await this.registry.classifyUsbDevice(hidDevice);
    } catch {
      // Fall back to Hub for 0x0d12 and Source for 0x0d01 if classification
      // throws (e.g. the device is mid-boot).
      role = hidDevice.productId === PRODUCT_ID_SOURCE ? "source" : "hub";
    }

    const device = this.registry.upsertFromUsb(hidDevice, role);

    if (device.kind === "hub" || device.kind === "sensor") {
      try {
        await this.startReadingDevice(hidDevice);
      } catch {
        this.emitter.emit("error", {
          title:
            device.kind === "hub"
              ? "Failed to start hub reader"
              : "Failed to start sensor reader",
          description:
            "Make sure the device is not in use by another program or browser tab.",
        });
      }
    }
  }

  private handleDeviceAdded(device: Device): void {
    this.emitter.emit("deviceAdded", device);
  }

  private handleDeviceRemoved(device: Device): void {
    if (
      (device.kind === "hub" || device.kind === "sensor") &&
      device.hidDevice
    ) {
      this.hidManager.stopReadingDevice(device.hidDevice);
      this.updateReadingState();
    }
    this.emitter.emit("deviceRemoved", device);
  }

  /* ---------------- Private: WebHID event plumbing ---------------- */

  private setupDisconnectHandler(): void {
    this.disconnectHandler = (e: HIDConnectionEvent) => {
      this.registry.removeUsb(e.device);
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
    const hasHub = this.registry.allHubs().length > 0;
    const hasUsbSensor = this.registry
      .allSensors()
      .some((s) => s.hidDevice !== null);
    if (!hasHub && !hasUsbSensor && this._isReading) {
      this._isReading = false;
      this.emitter.emit("reading", false);
      this.stopFrequencyTracking();
    }
  }

  /* ---------------- Private: liveness ---------------- */

  private startLivenessTracking(): void {
    this.stopLivenessTracking();
    this.livenessInterval = setInterval(() => {
      this.registry.tickTimeouts(Date.now(), DEVICE_TIMEOUT_MS);
    }, DEVICE_CLEANUP_INTERVAL_MS);
  }

  private stopLivenessTracking(): void {
    if (this.livenessInterval !== null) {
      clearInterval(this.livenessInterval);
      this.livenessInterval = null;
    }
  }

  /* ---------------- Private: frequency tracking ---------------- */

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

  /* ---------------- Private: packet ingress ---------------- */

  private processData(bytes: Uint8Array): void {
    const packet = new Packet(bytes);
    const packetDecoder = new PacketDecoder(packet);
    const { value: payloadType } = packetDecoder.getPayloadType();
    const header = packetDecoder.getDecodedHeader();
    const payload = packetDecoder.getDecodedPayload();

    this.trackPacket(header.sourceTxId, payloadType);

    switch (payloadType) {
      case PayloadType.EMF_IMU_FRAME_ID: {
        const data = payload as EmfImuFrameIdData;
        const sensor = this.registry.upsertSensorFromPacket(
          header.sourceTxId,
          data,
        );
        if (sensor === null) break;
        this.emitter.emit("emfImuFrameId", header, data);
        break;
      }
      case PayloadType.SOURCE_MEASUREMENT: {
        const data = payload as SourceMeasurementData;
        const source = this.registry.upsertSourceFromMeasurement(
          header.sourceTxId,
          data,
        );
        if (source === null) break;
        this.emitter.emit("sourceMeasurement", header, data);
        break;
      }
      case PayloadType.SOURCE_CALIBRATION: {
        const data = payload as SourceCalibrationData;
        const source = this.registry.upsertSourceFromCalibration(
          header.sourceTxId,
          data,
        );
        if (source === null) break;
        this.emitter.emit("sourceCalibration", header, data);
        break;
      }
    }
  }
}

export { Device, Hub, Sensor, Source };
export default AmfitrackWeb;
