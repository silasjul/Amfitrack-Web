import { ITransport } from "../interfaces/ITransport";

export class HIDConnection implements ITransport {
  private device: HIDDevice;
  private inputReportHandler: EventListener | null = null;

  constructor(device: HIDDevice) {
    this.device = device;
  }

  public async startReading(
    onData: (bytes: Uint8Array) => void,
  ): Promise<void> {
    if (!this.device.opened) {
      await this.device.open();
    }

    this.stopReading();

    this.inputReportHandler = (evt) => {
      const event = evt as HIDInputReportEvent;
      const bytes = new Uint8Array(event.data.buffer);
      onData(bytes);
    };

    this.device.addEventListener("inputreport", this.inputReportHandler);
  }

  public stopReading(): void {
    if (this.inputReportHandler) {
      this.device.removeEventListener("inputreport", this.inputReportHandler);
      this.inputReportHandler = null;
    }
  }

  public writeToDevice(bytes: Uint8Array): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public getProductName(): string {
    return this.device.productName;
  }
}
