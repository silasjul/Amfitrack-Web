import {
  Configuration,
  DeviceOrTxId,
  IConfigurator,
  Parameter,
} from "../interfaces/IConfigurator";
import { ITransport } from "../interfaces/ITransport";

export class Configurator implements IConfigurator {
  public getConfiguration(
    device: ITransport | string,
  ): Promise<Configuration[]> {
    throw new Error("Method not implemented.");
  }

  public getParameterValue(
    device: DeviceOrTxId,
    parameterUid: number,
  ): Promise<Parameter> {
    throw new Error("Method not implemented.");
  }

  public setParameterValue(
    device: DeviceOrTxId,
    parameterUid: number,
    value: Parameter,
  ): Promise<Parameter> {
    throw new Error("Method not implemented.");
  }
}
