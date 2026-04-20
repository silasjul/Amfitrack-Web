import { create } from "zustand";
import { PayloadType } from "../protocol/AmfitrackDecoder";
import type {
  SourceMeasurementData,
  SourceCalibrationData,
  EmfImuFrameIdData,
} from "../protocol/payloads";
import type { IDeviceStore } from "../interfaces/IStore";

export const useDeviceStore = create<IDeviceStore>((set) => ({
  deviceMeta: {},
  emfImuFrameId: {},
  sourceMeasurement: {},
  sourceCalibration: {},

  registerDevice: (txId, kind, readFromTxId) =>
    set((state) => {
      if (state.deviceMeta[txId]) return state;
      return {
        deviceMeta: {
          ...state.deviceMeta,
          [txId]: { kind, lastSeen: Date.now(), readFromTxId },
        },
      };
    }),

  removeDevice: (txId) =>
    set((state) => {
      const { [txId]: _meta, ...restMeta } = state.deviceMeta;
      const { [txId]: _emf, ...restEmf } = state.emfImuFrameId;
      const { [txId]: _meas, ...restMeas } = state.sourceMeasurement;
      const { [txId]: _cal, ...restCal } = state.sourceCalibration;
      return {
        deviceMeta: restMeta,
        emfImuFrameId: restEmf,
        sourceMeasurement: restMeas,
        sourceCalibration: restCal,
      };
    }),

  pingDevice: (txId) =>
    set((state) => {
      const meta = state.deviceMeta[txId];
      if (!meta) return state;
      return {
        deviceMeta: {
          ...state.deviceMeta,
          [txId]: { ...meta, lastSeen: Date.now() },
        },
      };
    }),

  updatePayload: (txId, payloadType, payload) =>
    set((state) => {
      switch (payloadType) {
        case PayloadType.EMF_IMU_FRAME_ID:
          return {
            emfImuFrameId: {
              ...state.emfImuFrameId,
              [txId]: payload as EmfImuFrameIdData,
            },
          };
        case PayloadType.SOURCE_MEASUREMENT:
          return {
            sourceMeasurement: {
              ...state.sourceMeasurement,
              [txId]: payload as SourceMeasurementData,
            },
          };
        case PayloadType.SOURCE_CALIBRATION:
          return {
            sourceCalibration: {
              ...state.sourceCalibration,
              [txId]: payload as SourceCalibrationData,
            },
          };
        default:
          return state;
      }
    }),
}));
