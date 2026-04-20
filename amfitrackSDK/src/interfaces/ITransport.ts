export interface ITransport {
  /**
   * Opens the device and begins listening for data.
   * @param onData Callback fired every time a byte array arrives.
   */
  startReading(onData: (bytes: Uint8Array) => void): Promise<void>;

  stopReading(): void;

  writeToDevice(bytes: Uint8Array): Promise<void>;
}
