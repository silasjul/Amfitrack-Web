import { create } from "zustand";

interface WebRTCConnectionState {
  // Set true when the user explicitly disconnects the WebRTC bridge from the
  // UI. The auto-connect hook honors this and stops retrying until cleared.
  manuallyDisconnected: boolean;
  setManuallyDisconnected: (value: boolean) => void;
}

export const useWebRTCConnectionStore = create<WebRTCConnectionState>((set) => ({
  manuallyDisconnected: false,
  setManuallyDisconnected: (value) => set({ manuallyDisconnected: value }),
}));
