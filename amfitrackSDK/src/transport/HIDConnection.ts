import {
  ITransport,
  DataCallback,
  DisconnectCallback,
  TransportConnectionKind,
} from "../interfaces/ITransport";

const HID_REPORT_ID = 0x01;
const HID_REPORT_DATA_SIZE = 63; // 64-byte USB report minus 1-byte report ID

export class HIDConnection implements ITransport {
  public readonly id: number;
  private device: HIDDevice;
  private listeners = new Set<DataCallback>();
  private disconnectCallbacks = new Set<DisconnectCallback>();
  private inputReportHandler: EventListener | null = null;
  private hidDisconnectHandler: ((ev: Event) => void) | null = null;

  constructor(device: HIDDevice, id: number) {
    this.device = device;
    this.id = id;
  }

  public getPhysicalLinkKey(): string | null {
    return null;
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

    this.hidDisconnectHandler = (ev: Event) => {
      const e = ev as HIDConnectionEvent;
      if (e.device === this.device) {
        this.fireDisconnect();
      }
    };
    navigator.hid.addEventListener("disconnect", this.hidDisconnectHandler);
  }

  public stopReading(): void {
    if (this.inputReportHandler) {
      this.device.removeEventListener("inputreport", this.inputReportHandler);
      this.inputReportHandler = null;
    }
    if (this.hidDisconnectHandler) {
      navigator.hid.removeEventListener("disconnect", this.hidDisconnectHandler);
      this.hidDisconnectHandler = null;
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
    if (this.device.opened) {
      await this.device.close();
    }
    for (const cb of this.disconnectCallbacks) cb();
    this.disconnectCallbacks.clear();
  }

  public async forget(): Promise<void> {
    await this.device.forget?.();
  }

  public async writeToDevice(bytes: Uint8Array): Promise<void> {
    const reportData = new Uint8Array(HID_REPORT_DATA_SIZE);
    reportData.set(bytes);
    await this.device.sendReport(HID_REPORT_ID, reportData);
  }

  public getProductName(): string {
    return this.device.productName;
  }

  public getProductId(): number {
    return this.device.productId;
  }

  public onDisconnect(cb: DisconnectCallback): void {
    this.disconnectCallbacks.add(cb);
  }

  public getConnectionKind(): TransportConnectionKind {
    return "usb";
  }

  private fireDisconnect(): void {
    this.stopReading();
    for (const cb of this.disconnectCallbacks) cb();
    this.disconnectCallbacks.clear();
  }
}
