import { ITransport } from "./ITransport";

export interface IReadPipeline {
  processData(bytes: Uint8Array, transport: ITransport): void;
}
