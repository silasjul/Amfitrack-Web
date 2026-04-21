import { ITransport } from "./ITransport";

export interface Parameter {
  value: number | boolean | string;
}

export interface Configuration {
  name: string;
  parameters: Parameter[];
}

export type DeviceOrTxId = ITransport | string;

export interface IConfigurator {
  getConfiguration(device: DeviceOrTxId): Promise<Configuration[]>;
  getParameter(device: DeviceOrTxId, parameterUid: number): Promise<Parameter>;
  setParameter(
    device: DeviceOrTxId,
    parameterUid: number,
    value: Parameter,
  ): Promise<Parameter>;
}
