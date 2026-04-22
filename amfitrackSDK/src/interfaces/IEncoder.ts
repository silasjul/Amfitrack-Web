export interface IEncoder {
  /** Wrap raw payload bytes in a full amfiprot packet (header + CRC). */
  encode(payloadBytes: Uint8Array, destinationId?: number): Uint8Array;

  /** Allocate a Common payload buffer with the given id as byte 0. */
  buildCommonPayload(
    id: number,
    size: number,
  ): { bytes: Uint8Array; view: DataView };

  /** Encode a typed config value into raw bytes. */
  encodeConfigValue(
    value: number | boolean | string,
    dataType: number,
  ): Uint8Array;
}
