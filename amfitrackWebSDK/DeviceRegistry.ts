import { Device, DeviceKind, Hub, Source, Sensor } from "./devices";
import type { Configurator, Configuration } from "./Configurator";
import { PRODUCT_ID_SENSOR, PRODUCT_ID_SOURCE } from "./config";
import type {
  EmfImuFrameIdData,
  SourceMeasurementData,
  SourceCalibrationData,
} from "./packets/decoders";

export interface DeviceRegistryCallbacks {
  onAdded: (device: Device) => void;
  onRemoved: (device: Device) => void;
  onUpdated: (device: Device) => void;
}

/**
 * Role returned by `classifyUsbDevice`.
 *
 * A USB-connected 0x0d01 is always a Source. A USB-connected 0x0d12 may be
 * either a Hub or a Sensor, so the registry probes the device (via Device
 * Name and/or Configuration categories) to decide.
 */
export type UsbRole = "hub" | "source" | "sensor";

/**
 * Central registry for all known Amfitrack devices.
 *
 * The registry is the single source of truth for which devices are present
 * and by which transport they are reachable. It is transport-agnostic:
 * USB-plugged devices and hub-forwarded devices both live here, and the
 * registry figures out add/remove/update transitions by timing them out
 * (hub-forwarded) or watching WebHID events (USB).
 */
export default class DeviceRegistry {
  private devices: Device[] = [];
  private configurator: Configurator;
  private callbacks: DeviceRegistryCallbacks;

  /**
   * Per-kind txIds that were recently retired (e.g. after a Device ID
   * write). Packets for these ids are dropped on ingress so in-flight /
   * buffered frames from just before the rename don't resurrect a phantom
   * device whose config fetch would be doomed. Values are absolute
   * `Date.now()` expiry timestamps.
   */
  private retiredTxIds = new Map<DeviceKind, Map<number, number>>();

  constructor(configurator: Configurator, callbacks: DeviceRegistryCallbacks) {
    this.configurator = configurator;
    this.callbacks = callbacks;
  }

  /* ---------------- lookup helpers ---------------- */

  public all(): ReadonlyArray<Device> {
    return this.devices;
  }

  public allHubs(): Hub[] {
    return this.devices.filter((d): d is Hub => d.kind === "hub");
  }

  public allSources(): Source[] {
    return this.devices.filter((d): d is Source => d.kind === "source");
  }

  public allSensors(): Sensor[] {
    return this.devices.filter((d): d is Sensor => d.kind === "sensor");
  }

  public findByHidDevice(hidDevice: HIDDevice): Device | undefined {
    return this.devices.find((d) => d.hidDevice === hidDevice);
  }

  public findByTxId(kind: DeviceKind, txId: number): Device | undefined {
    return this.devices.find((d) => d.kind === kind && d.txId === txId);
  }

  /* ---------------- USB role classification ---------------- */

  /**
   * Decide the role of a freshly-opened USB device.
   *
   * - 0x0d01 is always a Source.
   * - 0x0d12 may be either a Hub or a Sensor; we probe the device to
   *   differentiate. Defaults to Hub on any error so existing behaviour is
   *   preserved.
   */
  public async classifyUsbDevice(hidDevice: HIDDevice): Promise<UsbRole> {
    if (hidDevice.productId === PRODUCT_ID_SOURCE) return "source";

    if (hidDevice.productId === PRODUCT_ID_SENSOR) {
      try {
        const name = await this.configurator.getDeviceName(hidDevice);
        const role = classifyByName(name);
        if (role) return role;
      } catch {
        // Name probe failed — fall through to the category probe below.
      }

      try {
        const config =
          await this.configurator.getConfigurationUSBDevice(hidDevice);
        const role = classifyByConfiguration(config);
        if (role) return role;
      } catch {
        // Configuration probe failed — fall through to the default.
      }

      // TODO: refine discriminator strings once hub/sensor firmware names
      // are finalised. Defaulting to Hub matches historic behaviour.
      console.warn(
        "Could not determine role of 0x0d12 device; defaulting to Hub.",
      );
      return "hub";
    }

    // Unknown product id — treat as Hub so it at least opens in the UI.
    return "hub";
  }

  /* ---------------- USB transport ---------------- */

  /**
   * Register a device discovered via USB, or return the existing entry if we
   * already know about it.
   */
  public upsertFromUsb(hidDevice: HIDDevice, role: UsbRole): Device {
    const existing = this.findByHidDevice(hidDevice);
    if (existing) return existing;

    const device = createDevice(role, null, hidDevice);
    this.devices.push(device);
    this.callbacks.onAdded(device);
    return device;
  }

  /**
   * Remove every known device, emitting `onRemoved` for each. Used on SDK
   * shutdown so subscribers can reset their local state.
   */
  public clear(): void {
    const snapshot = [...this.devices];
    this.devices = [];
    for (const device of snapshot) {
      this.callbacks.onRemoved(device);
    }
  }

  /**
   * Attach a freshly-known txId to a USB device. If another entry already
   * exists for that txId via hub-forwarded packets, merge by keeping the
   * USB entry and dropping the hub-only duplicate.
   */
  public setTxId(device: Device, txId: number): void {
    if (device.txId === txId) return;

    const duplicate = this.findByTxId(device.kind, txId);
    if (duplicate && duplicate !== device) {
      this.remove(duplicate);
    }

    device.txId = txId;
    this.callbacks.onUpdated(device);
  }

  /**
   * Detach the USB transport from a device. Hubs are removed outright
   * (they have no other transport). Sources and Sensors are demoted to
   * hub-forwarded mode if they have been observed recently; otherwise
   * they are removed.
   */
  public removeUsb(hidDevice: HIDDevice): void {
    const device = this.findByHidDevice(hidDevice);
    if (!device) return;

    if (device.kind === "hub") {
      this.remove(device);
      return;
    }

    device.hidDevice = null;
    // Reset lastSeen so the timeout grace starts from now rather than the
    // last packet that may have been tracked before USB disconnect.
    device.touch();
    this.callbacks.onUpdated(device);
  }

  /* ---------------- hub-forwarded transport ---------------- */

  /**
   * Packet-driven upserts never emit `onUpdated` — they fire at the data
   * rate and would trash React reconciliation. Consumers that need the
   * latest payload subscribe to the dedicated data events (emfImuFrameId,
   * sourceMeasurement, sourceCalibration) directly.
   *
   * Returns `null` when the txId is in the retired-sensor tombstone window,
   * signalling callers that the packet should be dropped entirely.
   */
  public upsertSensorFromPacket(
    txId: number,
    frame: EmfImuFrameIdData,
  ): Sensor | null {
    let sensor = this.findByTxId("sensor", txId) as Sensor | undefined;
    if (!sensor) {
      // Drop packets for a recently-retired id so straggler frames can't
      // spawn a phantom sensor whose config fetch would be doomed.
      if (this.isTxIdRetired("sensor", txId)) return null;
      sensor = new Sensor(txId, null);
      sensor.lastFrame = frame;
      this.devices.push(sensor);
      this.callbacks.onAdded(sensor);
      return sensor;
    }

    sensor.lastFrame = frame;
    sensor.touch();
    return sensor;
  }

  /**
   * Mark a txId as retired for a short grace period for the given device
   * kind. Any packets arriving for this id during the window are dropped on
   * ingress so they can't spawn a ghost entry whose config fetch would be
   * doomed. Typically called after a successful Device ID write.
   */
  public retireTxId(
    kind: DeviceKind,
    txId: number,
    durationMs: number,
  ): void {
    let bucket = this.retiredTxIds.get(kind);
    if (!bucket) {
      bucket = new Map();
      this.retiredTxIds.set(kind, bucket);
    }
    bucket.set(txId, Date.now() + durationMs);
  }

  /** Clear a previously-set txId tombstone for the given device kind. */
  public clearRetiredTxId(kind: DeviceKind, txId: number): void {
    this.retiredTxIds.get(kind)?.delete(txId);
  }

  private isTxIdRetired(kind: DeviceKind, txId: number): boolean {
    const bucket = this.retiredTxIds.get(kind);
    if (!bucket) return false;
    const expiresAt = bucket.get(txId);
    if (expiresAt === undefined) return false;
    if (Date.now() >= expiresAt) {
      bucket.delete(txId);
      return false;
    }
    return true;
  }

  public upsertSourceFromMeasurement(
    txId: number,
    measurement: SourceMeasurementData,
  ): Source | null {
    const source = this.getOrCreateSource(txId);
    if (!source) return null;
    source.lastMeasurement = measurement;
    source.touch();
    return source;
  }

  public upsertSourceFromCalibration(
    txId: number,
    calibration: SourceCalibrationData,
  ): Source | null {
    const source = this.getOrCreateSource(txId);
    if (!source) return null;
    source.lastCalibration = calibration;
    source.touch();
    return source;
  }

  private getOrCreateSource(txId: number): Source | null {
    let source = this.findByTxId("source", txId) as Source | undefined;
    if (source) return source;
    if (this.isTxIdRetired("source", txId)) return null;
    source = new Source(txId, null);
    this.devices.push(source);
    this.callbacks.onAdded(source);
    return source;
  }

  /* ---------------- liveness ---------------- */

  /**
   * Remove any non-Hub device that has not been observed for `timeoutMs`.
   * USB-connected devices are exempt because we rely on WebHID events for
   * those.
   */
  public tickTimeouts(now: number, timeoutMs: number): void {
    const stale: Device[] = [];
    for (const device of this.devices) {
      if (device.hasTimedOut(now, timeoutMs)) {
        stale.push(device);
      }
    }
    for (const device of stale) {
      this.remove(device);
    }
  }

  /**
   * Explicitly drop a device from the registry, emitting `onRemoved` so
   * subscribers can reconcile. Used by rename/merge flows that need to
   * retire a stale entry without waiting for it to time out.
   */
  public removeDevice(device: Device): void {
    this.remove(device);
  }

  /* ---------------- internals ---------------- */

  private remove(device: Device): void {
    const idx = this.devices.indexOf(device);
    if (idx === -1) return;
    this.devices.splice(idx, 1);
    this.callbacks.onRemoved(device);
  }
}

function createDevice(
  role: UsbRole,
  txId: number | null,
  hidDevice: HIDDevice,
): Device {
  switch (role) {
    case "hub":
      return new Hub(hidDevice, txId);
    case "source":
      return new Source(txId, hidDevice);
    case "sensor":
      return new Sensor(txId, hidDevice);
  }
}

function classifyByName(name: string): UsbRole | null {
  const normalised = name.toLowerCase();
  if (normalised.includes("hub")) return "hub";
  if (normalised.includes("source")) return "source";
  if (normalised.includes("sensor")) return "sensor";
  return null;
}

function classifyByConfiguration(config: Configuration[]): UsbRole | null {
  for (const category of config) {
    const name = category.name.toLowerCase();
    if (name.includes("hub") || name.includes("wireless")) return "hub";
    if (name.includes("sensor")) return "sensor";
    if (name.includes("source")) return "source";
  }
  return null;
}
