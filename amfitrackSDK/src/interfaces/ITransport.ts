export type DataCallback = (bytes: Uint8Array) => void;

export type DisconnectCallback = () => void;

export type TransportConnectionKind = "usb" | "ble";

export interface ITransport {
  /** Opens the device and begins listening for incoming data. */
  startReading(): Promise<void>;

  stopReading(): void;

  addListener(cb: DataCallback): void;

  removeListener(cb: DataCallback): void;

  /** Register a one-shot callback fired when the physical link is lost. */
  onDisconnect(cb: DisconnectCallback): void;

  writeToDevice(bytes: Uint8Array): Promise<void>;

  getProductName(): string;

  getProductId(): number;

  /** Physical link used for this transport (HID vs Bluetooth). */
  getConnectionKind(): TransportConnectionKind;
}
