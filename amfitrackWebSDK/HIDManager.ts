import { VENDOR_ID, PRODUCT_ID_SENSOR, PRODUCT_ID_SOURCE } from "./config";

export default class HIDManager {
  private inputReportHandler: ((event: HIDInputReportEvent) => void) | null =
    null;
  private openingPromise: Promise<void> | null = null;

  private readingDevices: HIDDevice[] = [];

  public async requestDevice(
    productId: number,
    assign: (device: HIDDevice) => void,
  ): Promise<HIDDevice | null> {
    try {
      const devices = await navigator.hid.requestDevice({
        filters: [{ vendorId: VENDOR_ID, productId }],
      });

      if (devices.length === 0) {
        throw new Error("No device was selected.");
      }

      const device = devices[0];
      assign(device);
      return device;
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        throw new Error("No device was selected.");
      }
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  public async getDevice(
    vendorId: number,
    productId: number,
  ): Promise<HIDDevice | null> {
    const devices = await navigator.hid.getDevices();

    const authorizedDevices = devices.filter(
      (d) => d.vendorId === vendorId && d.productId === productId,
    );

    return authorizedDevices[0] ?? null;
  }

  public async startReadingDevice(device: HIDDevice, callback: (bytes: Uint8Array) => void) {
    if (!device) return;

    if (!device.opened) {
      if (!this.openingPromise) {
        this.openingPromise = device.open().finally(() => {
          this.openingPromise = null;
        });
      }
      await this.openingPromise;
    }

    if (this.inputReportHandler) {
      device.removeEventListener("inputreport", this.inputReportHandler);
    }

    this.inputReportHandler = (event: HIDInputReportEvent) => {
      const bytes = new Uint8Array(event.data.buffer);
      callback(bytes);
    };

    device.addEventListener("inputreport", this.inputReportHandler);
    
    this.readingDevices.push(device);
  }

  public stopReadingAll() {
    if (this.inputReportHandler) {
      this.readingDevices.forEach(device => {
        device.removeEventListener("inputreport", this.inputReportHandler as (event: HIDInputReportEvent) => void);
      });
      this.inputReportHandler = null;
      this.readingDevices = [];
    }
  }
}
