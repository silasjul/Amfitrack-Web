import { VENDOR_ID } from "./config";

const HID_REPORT_ID = 0x01;
const HID_REPORT_DATA_SIZE = 63; // 64-byte USB report minus 1-byte report ID

/**
 * Manages WebHID device connections and raw I/O.
 *
 * This class handles the transport layer only — opening devices,
 * sending raw HID reports, and reading continuous input data.
 * Protocol-level logic (amfiprot packets) lives in PacketBuilder and Configurator.
 */
export default class HIDManager {
  private inputReportHandler: ((event: HIDInputReportEvent) => void) | null =
    null;
  private openingPromises = new WeakMap<HIDDevice, Promise<void>>();

  private readingDevices: HIDDevice[] = [];

  /**
   * Prompt the user to select and authorize a device.
   */
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

  /**
   * Get an already-authorized device by vendor/product ID.
   */
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

  /**
   * Open a device if not already open.
   * Uses a per-device promise to prevent duplicate open() calls.
   */
  public async openDevice(device: HIDDevice) {
    if (!device) return;
    if (device.opened) return;

    let pending = this.openingPromises.get(device);
    if (!pending) {
      pending = device.open().finally(() => {
        this.openingPromises.delete(device);
      });
      this.openingPromises.set(device, pending);
    }
    await pending;
  }

  /**
   * Start continuous reading from a device.
   * Every incoming HID report is passed to the callback as raw bytes.
   */
  public async startReadingDevice(
    device: HIDDevice,
    callback: (bytes: Uint8Array) => void,
  ) {
    if (!device) return;

    await this.openDevice(device);

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
      this.readingDevices.forEach((device) => {
        device.removeEventListener(
          "inputreport",
          this.inputReportHandler as (event: HIDInputReportEvent) => void,
        );
      });
      this.inputReportHandler = null;
      this.readingDevices = [];
    }
  }

  /**
   * Send raw packet data as a HID output report.
   */
  public async sendReport(
    device: HIDDevice,
    data: Uint8Array,
  ): Promise<void> {
    const reportData = new Uint8Array(HID_REPORT_DATA_SIZE);
    reportData.set(data);
    await device.sendReport(HID_REPORT_ID, reportData);
  }
}
