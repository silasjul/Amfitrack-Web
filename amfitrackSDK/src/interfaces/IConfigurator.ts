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

export interface IConfigurator {
  getConfiguration(device: DeviceOrTxId): Promise<Configuration[]>;
  getParameter(
    device: DeviceOrTxId,
    parameterUid: number,
  ): Promise<ParameterValue>;
  setParameter(
    device: DeviceOrTxId,
    parameterUid: number,
    value: ParameterValue,
  ): Promise<ParameterValue>;
  extractDeviceId(configuration: Configuration[]): number | null;
}
