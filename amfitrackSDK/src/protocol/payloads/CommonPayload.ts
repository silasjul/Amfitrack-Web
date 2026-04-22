/**
 * Common payload IDs from the amfiprot protocol.
 *
 * Mirrors CommonPayloadId in common_payload.py.
 * When PayloadType is COMMON (0x00), the first byte of the payload
 * is one of these IDs, identifying the specific command or reply.
 */
export enum CommonPayloadId {
  REQUEST_DEVICE_ID = 0x00,
  REPLY_DEVICE_ID = 0x01,
  SET_TX_ID = 0x02,
  REQUEST_FIRMWARE_VERSION = 0x03,
  REPLY_FIRMWARE_VERSION = 0x04,
  FIRMWARE_START = 0x05,
  FIRMWARE_DATA = 0x06,
  FIRMWARE_END = 0x07,
  REQUEST_DEVICE_NAME = 0x08,
  REPLY_DEVICE_NAME = 0x09,
  REQUEST_CONFIGURATION_VALUE = 0x0a,
  REPLY_CONFIGURATION_VALUE = 0x0b,
  SET_CONFIGURATION_VALUE = 0x0c,
  REQUEST_CONFIGURATION_NAME = 0x0d,
  REPLY_CONFIGURATION_NAME = 0x0e,
  LOAD_DEFAULT = 0x0f,
  SAVE_AS_DEFAULT = 0x10,
  REQUEST_CONFIGURATION_NAME_AND_UID = 0x11,
  REPLY_CONFIGURATION_NAME_AND_UID = 0x12,
  REQUEST_CONFIGURATION_VALUE_UID = 0x13,
  REPLY_CONFIGURATION_VALUE_UID = 0x14,
  SET_CONFIGURATION_VALUE_UID = 0x15,
  REQUEST_CONFIGURATION_CATEGORY = 0x16,
  REPLY_CONFIGURATION_CATEGORY = 0x17,
  REQUEST_CONFIGURATION_VALUE_COUNT = 0x18,
  REPLY_CONFIGURATION_VALUE_COUNT = 0x19,
  REQUEST_CATEGORY_COUNT = 0x1a,
  REPLY_CATEGORY_COUNT = 0x1b,
  REQUEST_FIRMWARE_VERSION_PER_ID = 0x1c,
  REPLY_FIRMWARE_VERSION_PER_ID = 0x1d,
  DEBUG_OUTPUT = 0x20,
  REBOOT = 0x21,
  RESET_PARAMETER = 0x24,
}

import { IPayloadDecoder } from "../../interfaces/IDecoder";

export type CommonData = ReturnType<CommonPayload["getDecoded"]>;

export class CommonPayload implements IPayloadDecoder<CommonData> {
  public getDecoded(payload: Uint8Array) {
    const view = new DataView(
      payload.buffer,
      payload.byteOffset,
      payload.byteLength,
    );

    return {
      test: "test",
    };
  }
}
