import { create } from "zustand";

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  startTime: number | null;
  accumulatedMs: number;
  selection: Record<number, string[]>;
  startRecording: (selection: Record<number, string[]>) => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
}

export const useRecordingStore = create<RecordingState>((set, get) => ({
  isRecording: false,
  isPaused: false,
  startTime: null,
  accumulatedMs: 0,
  selection: {},

  startRecording: (selection) =>
    set({
      isRecording: true,
      isPaused: false,
      startTime: Date.now(),
      accumulatedMs: 0,
      selection,
    }),

  stopRecording: () =>
    set({
      isRecording: false,
      isPaused: false,
      startTime: null,
      accumulatedMs: 0,
      selection: {},
    }),

  pauseRecording: () => {
    const { startTime, accumulatedMs } = get();
    set({
      isPaused: true,
      accumulatedMs: accumulatedMs + (startTime ? Date.now() - startTime : 0),
      startTime: null,
    });
  },

  resumeRecording: () => set({ isPaused: false, startTime: Date.now() }),
}));
