export type DataCallback = (bytes: Uint8Array) => void;

export interface ITransport {
  /** Opens the device and begins listening for incoming data. */
  startReading(): Promise<void>;

  stopReading(): void;

  addListener(cb: DataCallback): void;

  removeListener(cb: DataCallback): void;

  writeToDevice(bytes: Uint8Array): Promise<void>;

  getProductName(): string;
}
