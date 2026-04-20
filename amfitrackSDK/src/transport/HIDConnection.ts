import { ITransport } from "../interfaces/ITransport";

export class HIDConnection implements ITransport {
  private device: HIDDevice;

  constructor(device: HIDDevice) {
    this.device = device;
  }

  startReading(onData: (bytes: Uint8Array) => void): Promise<void> {
    throw new Error("Method not implemented.");
  }

  stopReading(): void {
    throw new Error("Method not implemented.");
  }

  writeToDevice(bytes: Uint8Array): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
