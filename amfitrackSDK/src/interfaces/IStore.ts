import type { PayloadType, DecodedPayload } from "../protocol/AmfitrackDecoder";
import type {
  SourceMeasurementData,
  SourceCalibrationData,
  EmfImuFrameIdData,
} from "../protocol/payloads";
import type { Configuration } from "./IConfigurator";

export type DeviceKind = "hub" | "source" | "sensor";

export interface DeviceMeta {
  kind: DeviceKind;
  lastSeen: number;
  readFromTxId: number | null;
  configuration?: Configuration[];
}

export interface IDeviceStoreState {
  deviceMeta: Record<number, DeviceMeta>;
  emfImuFrameId: Record<number, EmfImuFrameIdData>;
  sourceMeasurement: Record<number, SourceMeasurementData>;
  sourceCalibration: Record<number, SourceCalibrationData>;
}

export interface IDeviceStoreActions {
  registerDevice: (
    txId: number,
    kind: DeviceKind,
    readFromTxId: number | null,
  ) => void;
  removeDevice: (txId: number) => void;
  pingDevice: (txId: number) => void;
  updatePayload: (
    txId: number,
    payloadType: PayloadType,
    payload: DecodedPayload,
  ) => void;
  commitSourceTxIdResolution: (
    temporaryTxId: number,
    resolvedTxId: number,
    configuration: Configuration[],
  ) => void;
  updateConfiguration: (txId: number, configuration: Configuration[]) => void;
}

export type IDeviceStore = IDeviceStoreState & IDeviceStoreActions;
