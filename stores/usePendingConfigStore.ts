import { create } from "zustand";
import axios from "axios";
import {
  parseConfigToObject,
  type ParsedConfig,
} from "@/lib/configTooltipParser";

export interface PendingConfiguration {
  txId: number;
  paramUid: number;
  categoryName: string;
  parameterName: string;
  currentValue: number | boolean | string;
  valueToPush: number | boolean | string;
}

interface PendingConfigState {
  pending: PendingConfiguration[];
  configurationTooltips: ParsedConfig;
  lastDeviceIdRemap: { oldTxId: number; newTxId: number } | null;

  updatePending: (entry: PendingConfiguration) => void;
  removePending: (txId: number, paramUid: number) => void;
  removePendingForDevice: (txId: number) => void;
  remapDeviceTxId: (oldTxId: number, newTxId: number) => void;
  clearPending: () => void;
  fetchTooltips: () => Promise<void>;
}

export const usePendingConfigStore = create<PendingConfigState>((set, get) => ({
  pending: [],
  configurationTooltips: {},
  lastDeviceIdRemap: null,

  updatePending: (entry) =>
    set((state) => {
      const idx = state.pending.findIndex(
        (c) => c.txId === entry.txId && c.paramUid === entry.paramUid,
      );

      if (entry.currentValue === entry.valueToPush) {
        if (idx >= 0)
          return { pending: state.pending.filter((_, i) => i !== idx) };
        return state;
      }

      if (idx >= 0) {
        const updated = [...state.pending];
        updated[idx] = entry;
        return { pending: updated };
      }
      return { pending: [...state.pending, entry] };
    }),

  removePending: (txId, paramUid) =>
    set((state) => ({
      pending: state.pending.filter(
        (c) => !(c.txId === txId && c.paramUid === paramUid),
      ),
    })),

  removePendingForDevice: (txId) =>
    set((state) => ({
      pending: state.pending.filter((c) => c.txId !== txId),
    })),

  remapDeviceTxId: (oldTxId, newTxId) =>
    set((state) => ({
      pending: state.pending.map((c) =>
        c.txId === oldTxId ? { ...c, txId: newTxId } : c,
      ),
      lastDeviceIdRemap: { oldTxId, newTxId },
    })),

  clearPending: () => set({ pending: [] }),

  fetchTooltips: async () => {
    try {
      const tooltips = await axios.get("/api/configuration-tooltips");
      const parsedTooltips = parseConfigToObject(tooltips.data, {
        includeRstOnlyBlocks: true,
      });
      set({ configurationTooltips: parsedTooltips });
    } catch (err) {
      console.error(
        "[PendingConfigStore] Failed to load configuration tooltips:",
        err,
      );
    }
  },
}));
