import { create } from "zustand";
import { PayloadType } from "../protocol/AmfitrackDecoder";
import type {
  SourceMeasurementData,
  SourceCalibrationData,
  EmfImuFrameIdData,
} from "../protocol/payloads";
import type { IDeviceStore } from "../interfaces/IStore";

export const useDeviceStore = create<IDeviceStore>((set, get) => ({
  deviceMeta: {},
  emfImuFrameId: {},
  sourceMeasurement: {},
  sourceCalibration: {},
  frequency: {},

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
      const { [txId]: _freq, ...restFreq } = state.frequency;
      return {
        deviceMeta: restMeta,
        emfImuFrameId: restEmf,
        sourceMeasurement: restMeas,
        sourceCalibration: restCal,
        frequency: restFreq,
      };
    }),

  pingDevice: (txId) => {
    // Mutate in place — lastSeen is only consumed by DeviceManager's
    // liveness check via getState(), never rendered in UI. Avoiding set()
    // prevents re-renders on every incoming packet.
    const meta = get().deviceMeta[txId];
    if (meta) meta.lastSeen = Date.now();
  },

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

  commitSourceTxIdResolution: (temporaryTxId, resolvedTxId, configuration) =>
    set((state) => {
      const { [temporaryTxId]: tempMeta, ...restMeta } = state.deviceMeta;
      const { [temporaryTxId]: tempEmf, ...restEmf } = state.emfImuFrameId;
      const { [temporaryTxId]: tempMeas, ...restMeas } =
        state.sourceMeasurement;
      const { [temporaryTxId]: tempCal, ...restCal } = state.sourceCalibration;

      const existingMeta = restMeta[resolvedTxId];

      const updatedMeta: Record<number, typeof tempMeta> = {
        ...restMeta,
        [resolvedTxId]: {
          ...(tempMeta ?? existingMeta),
          ...existingMeta,
          configuration,
        },
      };

      for (const key of Object.keys(updatedMeta)) {
        const id = Number(key);
        const meta = updatedMeta[id];
        if (meta && meta.readFromTxId === temporaryTxId) {
          updatedMeta[id] = { ...meta, readFromTxId: resolvedTxId };
        }
      }

      return {
        deviceMeta: updatedMeta,
        emfImuFrameId: tempEmf
          ? { ...restEmf, [resolvedTxId]: tempEmf }
          : restEmf,
        sourceMeasurement: tempMeas
          ? { ...restMeas, [resolvedTxId]: tempMeas }
          : restMeas,
        sourceCalibration: tempCal
          ? { ...restCal, [resolvedTxId]: tempCal }
          : restCal,
      };
    }),

  updateConfiguration: (txId, configuration) =>
    set((state) => {
      const meta = state.deviceMeta[txId];
      if (!meta) return state;
      return {
        deviceMeta: {
          ...state.deviceMeta,
          [txId]: { ...meta, configuration },
        },
      };
    }),

  updateParameterValue: (txId, paramUid, value) =>
    set((state) => {
      const meta = state.deviceMeta[txId];
      if (!meta?.configuration) return state;
      const configuration = meta.configuration.map((cat) => ({
        ...cat,
        parameters: cat.parameters.map((p) =>
          p.uid === paramUid ? { ...p, value } : p,
        ),
      }));
      return {
        deviceMeta: {
          ...state.deviceMeta,
          [txId]: { ...meta, configuration },
        },
      };
    }),

  remapDeviceTxId: (oldTxId, newTxId) =>
    set((state) => {
      const { [oldTxId]: meta, ...restMeta } = state.deviceMeta;
      const { [oldTxId]: emf, ...restEmf } = state.emfImuFrameId;
      const { [oldTxId]: meas, ...restMeas } = state.sourceMeasurement;
      const { [oldTxId]: cal, ...restCal } = state.sourceCalibration;
      if (!meta) return state;

      const updatedMeta: typeof state.deviceMeta = {
        ...restMeta,
        [newTxId]: meta,
      };

      for (const key of Object.keys(updatedMeta)) {
        const id = Number(key);
        const m = updatedMeta[id];
        if (m && m.readFromTxId === oldTxId) {
          updatedMeta[id] = { ...m, readFromTxId: newTxId };
        }
      }

      const { [oldTxId]: freq, ...restFreq } = state.frequency;
      return {
        deviceMeta: updatedMeta,
        emfImuFrameId: emf ? { ...restEmf, [newTxId]: emf } : restEmf,
        sourceMeasurement: meas
          ? { ...restMeas, [newTxId]: meas }
          : restMeas,
        sourceCalibration: cal ? { ...restCal, [newTxId]: cal } : restCal,
        frequency: freq ? { ...restFreq, [newTxId]: freq } : restFreq,
      };
    }),

  updateFrequencies: (frequencies) =>
    set(() => ({ frequency: frequencies })),

  clearAll: () =>
    set(() => ({
      deviceMeta: {},
      emfImuFrameId: {},
      sourceMeasurement: {},
      sourceCalibration: {},
      frequency: {},
    })),
}));
