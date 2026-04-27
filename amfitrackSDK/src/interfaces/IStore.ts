import type { PayloadType, DecodedPayload } from "../protocol/AmfitrackDecoder";
import type {
  SourceMeasurementData,
  SourceCalibrationData,
  EmfImuFrameIdData,
} from "../protocol/payloads";
import type { Configuration, ParameterValue } from "./IConfigurator";

export type DeviceKind = "hub" | "source" | "sensor" | "unknown";

/**
 * How a device's packets reach us:
 *   "usb" | "ble"  — device is physically connected on this link
 *   number          — packets are relayed through the hub with this TX ID
 *   null            — not yet determined (transient during initial registration)
 */
export type DeviceUplink = number | "usb" | "ble" | null;

export interface DeviceFrequency {
  totalHz: number;
  byPayloadType: Partial<Record<PayloadType, number>>;
}

export interface DeviceVersions {
  firmware: string;
  hardware: string;
  RF: string;
}

export interface DeviceMeta {
  kind: DeviceKind;
  lastSeen: number;
  uplink: DeviceUplink;
  configuration?: Configuration[];
  versions?: DeviceVersions;
}

export interface IDeviceStoreState {
  deviceMeta: Record<number, DeviceMeta>;
  emfImuFrameId: Record<number, EmfImuFrameIdData>;
  sourceMeasurement: Record<number, SourceMeasurementData>;
  sourceCalibration: Record<number, SourceCalibrationData>;
  frequency: Record<number, DeviceFrequency>;
}

export interface IDeviceStoreActions {
  registerDevice: (
    txId: number,
    kind: DeviceKind,
    uplink: DeviceUplink,
  ) => void;
  removeDevice: (txId: number) => void;
  pingDevice: (txId: number) => void;
  updatePayload: (
    txId: number,
    payloadType: PayloadType,
    payload: DecodedPayload,
  ) => void;
  commitTransportTxIdResolution: (
    temporaryTxId: number,
    resolvedTxId: number,
    configuration: Configuration[],
    kind: DeviceKind,
    versions?: DeviceVersions,
  ) => void;
  updateConfiguration: (txId: number, configuration: Configuration[]) => void;
  updateVersions: (txId: number, versions: DeviceVersions) => void;
  updateParameterValue: (
    txId: number,
    paramUid: number,
    value: ParameterValue,
  ) => void;
  remapDeviceTxId: (oldTxId: number, newTxId: number) => void;
  updateFrequencies: (frequencies: Record<number, DeviceFrequency>) => void;
  clearAll: () => void;
}

export type IDeviceStore = IDeviceStoreState & IDeviceStoreActions;

/** Minimal accessor that classes use to reach the store at runtime. */
export type DeviceStoreApi = {
  getState: () => IDeviceStore;
};
