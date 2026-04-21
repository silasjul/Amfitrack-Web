import { ITransport } from "./ITransport";

export interface Parameter {
  name: string;
  uid: number;
  value: number | boolean | string;
}

export interface Configuration {
  name: string;
  parameters: Parameter[];
}

export type DeviceOrTxId = ITransport | string;

export interface IConfigurator {
  getConfiguration(device: DeviceOrTxId): Promise<Configuration[]>;
  getParameterValue(device: DeviceOrTxId, parameterUid: number): Promise<Parameter>;
  setParameterValue(
    device: DeviceOrTxId,
    parameterUid: number,
    value: Parameter,
  ): Promise<Parameter>;
}
