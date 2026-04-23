import { ParameterValue } from "./IConfigurator";

export interface SetParamResult {
  value: ParameterValue;
  /** Present when the device TX ID changed (e.g. Device ID param). */
  txIdChanged?: number;
  /** True when remaining pending params for this device are now invalid
   *  (e.g. config mode changed → parameter tree was rebuilt). */
  configInvalidated?: boolean;
}

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
    value: ParameterValue,
  ): Promise<SetParamResult>;

  /** Disconnect a single device by its TX ID. */
  disconnectDevice(txId: number): Promise<void>;

  /** Start polling for previously-granted HID and BLE devices. */
  initialize(): void;

  /** Disconnect and release resources (listeners, transports, etc.). */
  destroy(): Promise<void>;
}
