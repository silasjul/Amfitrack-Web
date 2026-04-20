export interface IAmfitrackSDK {
  /** Connect to a device over USB. */
  requestConnectionViaUSB(productIds: number[]): Promise<boolean>;

  /** Connect to a device over BLE. */
  requestConnectionViaBLE(productIds: number[]): Promise<boolean>;

  /**
   * Set a parameter on a device.
   *
   * @param deviceID - Target device id.
   * @param paramUID - Parameter id.
   * @param value - New value.
   */
  setParam(
    deviceID: number,
    paramUID: number,
    value: number | boolean | string,
  ): Promise<number | boolean | string>;

  /** Initialize the SDK. Setup listeners and auto connect to known USB devices. */
  initialize(): Promise<void>;

  /** Disconnect and release resources (listeners, transports, etc.). */
  destroy(): Promise<void>;
}
