import { ITransport, DataCallback } from "../interfaces/ITransport";

const HID_REPORT_ID = 0x01;
const HID_REPORT_DATA_SIZE = 63; // 64-byte USB report minus 1-byte report ID

export class HIDConnection implements ITransport {
  private device: HIDDevice;
  private listeners = new Set<DataCallback>();
  private inputReportHandler: EventListener | null = null;

  constructor(device: HIDDevice) {
    this.device = device;
  }

  public async startReading(): Promise<void> {
    if (!this.device.opened) {
      await this.device.open();
    }

    this.stopReading();

    this.inputReportHandler = (evt) => {
      const event = evt as HIDInputReportEvent;
      const bytes = new Uint8Array(event.data.buffer);
      for (const cb of this.listeners) cb(bytes);
    };

    this.device.addEventListener("inputreport", this.inputReportHandler);
  }

  public stopReading(): void {
    if (this.inputReportHandler) {
      this.device.removeEventListener("inputreport", this.inputReportHandler);
      this.inputReportHandler = null;
    }
  }

  public addListener(cb: DataCallback): void {
    this.listeners.add(cb);
  }

  public removeListener(cb: DataCallback): void {
    this.listeners.delete(cb);
  }

  public async writeToDevice(bytes: Uint8Array): Promise<void> {
    const reportData = new Uint8Array(HID_REPORT_DATA_SIZE);
    reportData.set(bytes);
    await this.device.sendReport(HID_REPORT_ID, reportData);
  }

  public getProductName(): string {
    return this.device.productName;
  }
}
