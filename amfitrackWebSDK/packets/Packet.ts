export class Packet {
  private bytes: Uint8Array;
  private header: Uint8Array;
  private payload: Uint8Array;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.header = bytes.subarray(1, 8);
    this.payload = bytes.subarray(8);
  }

  public getBytes() {
    return this.bytes;
  }

  public getHeader() {
    return this.header;
  }

  public getPayload() {
    return this.payload;
  }
}