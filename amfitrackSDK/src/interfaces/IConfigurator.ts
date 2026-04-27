import { ITransport } from "./ITransport";

export type ParameterValue = number | boolean | string;
export interface Parameter {
  name: string;
  uid: number;
  value: number | boolean | string;
}

export interface Configuration {
  name: string;
  parameters: Parameter[];
}

export type DeviceOrTxId = ITransport | number;

export interface SetParameterOptions {
  alternateSourceTxId?: number;
  timeoutMs?: number;
  retries?: number;
}

export interface IConfigurator {
  getConfiguration(device: DeviceOrTxId): Promise<Configuration[]>;
  getDeviceName(device: DeviceOrTxId): Promise<string>;
  getParameter(
    device: DeviceOrTxId,
    parameterUid: number,
  ): Promise<ParameterValue>;
  setParameter(
    device: DeviceOrTxId,
    parameterUid: number,
    value: ParameterValue,
    options?: SetParameterOptions,
  ): Promise<ParameterValue>;
  extractDeviceId(configuration: Configuration[]): number | null;
  getVersions(device: DeviceOrTxId): Promise<{ firmware: string; hardware: string, RF: string }>;
}
