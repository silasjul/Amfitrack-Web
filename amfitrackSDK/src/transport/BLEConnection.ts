import {
  ITransport,
  DataCallback,
  DisconnectCallback,
  TransportConnectionKind,
} from "../interfaces/ITransport";
import { AMFITRACK_SERVICE_UUID } from "../../config";

export class BLEConnection implements ITransport {
  public readonly id: number;
  private device: BluetoothDevice;
  private listeners = new Set<DataCallback>();
  private disconnectCallbacks = new Set<DisconnectCallback>();
  private notifyCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private onCharValueChanged: ((event: Event) => void) | null = null;
  private gattDisconnectHandler: (() => void) | null = null;

  constructor(device: BluetoothDevice, id: number) {
    this.device = device;
    this.id = id;
  }

  public getPhysicalLinkKey(): string | null {
    return `ble:${this.device.id}`;
  }

  public async startReading(): Promise<void> {
    const gatt = this.device.gatt;
    if (!gatt) throw new Error("GATT server not available on this device");

    if (!gatt.connected) {
      await gatt.connect();
    }

    const service = await gatt.getPrimaryService(AMFITRACK_SERVICE_UUID);
    const characteristics = await service.getCharacteristics();

    for (const char of characteristics) {
      if (char.properties.notify && !this.notifyCharacteristic) {
        this.notifyCharacteristic = char;
      }
      if (
        (char.properties.write || char.properties.writeWithoutResponse) &&
        !this.writeCharacteristic
      ) {
        this.writeCharacteristic = char;
      }
    }

    if (!this.notifyCharacteristic) {
      throw new Error(
        "No notify characteristic found on AMFITRACK BLE service",
      );
    }

    this.stopReading();

    this.onCharValueChanged = (event: Event) => {
      const char = event.target as BluetoothRemoteGATTCharacteristic;
      if (char.value) {
        const raw = new Uint8Array(
          char.value.buffer,
          char.value.byteOffset,
          char.value.byteLength,
        );
        // The pipeline expects byte 0 to be a padding / report-ID byte (as in
        // USB HID). BLE has no such prefix, so we prepend a zero byte.
        const bytes = new Uint8Array(raw.length + 1);
        bytes.set(raw, 1);
        for (const cb of this.listeners) cb(bytes);
      }
    };

    this.notifyCharacteristic.addEventListener(
      "characteristicvaluechanged",
      this.onCharValueChanged,
    );
    await this.notifyCharacteristic.startNotifications();

    this.gattDisconnectHandler = () => this.fireDisconnect();
    this.device.addEventListener(
      "gattserverdisconnected",
      this.gattDisconnectHandler,
    );
  }

  public stopReading(): void {
    if (this.notifyCharacteristic && this.onCharValueChanged) {
      this.notifyCharacteristic.removeEventListener(
        "characteristicvaluechanged",
        this.onCharValueChanged,
      );
      this.onCharValueChanged = null;
    }
    if (this.gattDisconnectHandler) {
      this.device.removeEventListener(
        "gattserverdisconnected",
        this.gattDisconnectHandler,
      );
      this.gattDisconnectHandler = null;
    }
  }

  public addListener(cb: DataCallback): void {
    this.listeners.add(cb);
  }

  public removeListener(cb: DataCallback): void {
    this.listeners.delete(cb);
  }

  public async disconnect(): Promise<void> {
    this.stopReading();
    if (this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    for (const cb of this.disconnectCallbacks) cb();
    this.disconnectCallbacks.clear();
  }

  public async forget(): Promise<void> {
    await this.device.forget?.();
  }

  public async writeToDevice(bytes: Uint8Array): Promise<void> {
    if (!this.writeCharacteristic) {
      throw new Error("No write characteristic available");
    }

    const payload = bytes.slice();
    if (this.writeCharacteristic.properties.writeWithoutResponse) {
      await this.writeCharacteristic.writeValueWithoutResponse(payload);
    } else {
      await this.writeCharacteristic.writeValueWithResponse(payload);
    }
  }

  public getProductName(): string {
    return this.device.name ?? "Unknown BLE Device";
  }

  public getProductId(): number {
    return 0;
  }

  public onDisconnect(cb: DisconnectCallback): void {
    this.disconnectCallbacks.add(cb);
  }

  public getConnectionKind(): TransportConnectionKind {
    return "ble";
  }

  private fireDisconnect(): void {
    this.stopReading();
    for (const cb of this.disconnectCallbacks) cb();
    this.disconnectCallbacks.clear();
  }
}
