import { IDecoder } from "../interfaces/IProtocol";

export class ReadPipeline {
  private decoder: IDecoder;

  constructor(decoder: IDecoder) {
    this.decoder = decoder;
  }

  processData(bytes: Uint8Array): void {
    const { header, payload } = this.decoder.decode(bytes);
    console.log(header, payload);
  }
}
