export type DataCallback = (bytes: Uint8Array) => void;

export type DisconnectCallback = () => void;

export type TransportConnectionKind = "usb" | "ble";

export interface ITransport {
  /** Monotonic id assigned by the SDK when the transport is constructed. */
  readonly id: number;

  /**
   * Stable key for the physical link, if the SDK should allow only one active
   * transport per key (e.g. one BLE wrapper per BluetoothDevice).
   */
  getPhysicalLinkKey(): string | null;

  /** Opens the device and begins listening for incoming data. */
  startReading(): Promise<void>;

  stopReading(): void;

  addListener(cb: DataCallback): void;

  removeListener(cb: DataCallback): void;

  /** Programmatically close the physical link and release resources. */
  disconnect(): Promise<void>;

  /**
   * Revoke the browser's permission grant for this device so it is no longer
   * returned by getDevices() / getDevices() and cannot be auto-reconnected by
   * the poll interval. Call this only on user-initiated disconnects.
   */
  forget(): Promise<void>;

  /** Register a one-shot callback fired when the physical link is lost. */
  onDisconnect(cb: DisconnectCallback): void;

  writeToDevice(bytes: Uint8Array): Promise<void>;

  getProductName(): string;

  getProductId(): number;

  /** Physical link used for this transport (HID vs Bluetooth). */
  getConnectionKind(): TransportConnectionKind;
}
