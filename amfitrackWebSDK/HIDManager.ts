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
  private inputReportHandlers = new Map<
    HIDDevice,
    (event: HIDInputReportEvent) => void
  >();
  private openingPromises = new WeakMap<HIDDevice, Promise<void>>();

  /**
   * Prompt the user to select and authorize a device.
   */
  public async requestDevice(
    productId: number,
  ): Promise<HIDDevice | null> {
    try {
      const devices = await navigator.hid.requestDevice({
        filters: [{ vendorId: VENDOR_ID, productId }],
      });

      if (devices.length === 0) {
        throw new Error("No device was selected.");
      }

      return devices[0];
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        throw new Error("No device was selected.");
      }
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  /**
   * Get all already-authorized devices by vendor/product ID.
   */
  public async getDevices(
    vendorId: number,
    productId: number,
  ): Promise<HIDDevice[]> {
    const devices = await navigator.hid.getDevices();
    return devices.filter(
      (d) => d.vendorId === vendorId && d.productId === productId,
    );
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
   * Each device gets its own listener so multiple devices can read concurrently.
   */
  public async startReadingDevice(
    device: HIDDevice,
    callback: (bytes: Uint8Array) => void,
  ) {
    if (!device) return;

    await this.openDevice(device);

    this.stopReadingDevice(device);

    const handler = (event: HIDInputReportEvent) => {
      const bytes = new Uint8Array(event.data.buffer);
      callback(bytes);
    };

    this.inputReportHandlers.set(device, handler);
    device.addEventListener("inputreport", handler);
  }

  /**
   * Stop reading from a single device.
   */
  public stopReadingDevice(device: HIDDevice) {
    const handler = this.inputReportHandlers.get(device);
    if (handler) {
      device.removeEventListener("inputreport", handler);
      this.inputReportHandlers.delete(device);
    }
  }

  public stopReadingAll() {
    for (const [device, handler] of this.inputReportHandlers) {
      device.removeEventListener("inputreport", handler);
    }
    this.inputReportHandlers.clear();
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
