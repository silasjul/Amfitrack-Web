/**
 * CRC-8 with polynomial 0x2F.
 *
 * Matches the amfiprot protocol's CRC used in packet.py:
 *   crcmod.Crc(0x12F, initCrc=0, rev=False)
 *
 * The leading 1 in 0x12F is implicit (x^8 term), leaving polynomial 0x2F.
 */
export function crc8(data: Uint8Array): number {
  let crc = 0;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x80 ? ((crc << 1) ^ 0x2f) & 0xff : (crc << 1) & 0xff;
    }
  }
  return crc;
}
