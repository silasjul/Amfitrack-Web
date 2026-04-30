import type { RecordingFrame } from "@/lib/recordingCsv";

type FrameListener = (frame: RecordingFrame) => void;

const listeners = new Set<FrameListener>();
let frames: RecordingFrame[] = [];
// Tracks the last emitted timestamp per deviceKey to guarantee strict monotonicity
const lastTimestamp = new Map<string, number>();

export const recordingSession = {
  clear() {
    frames = [];
    lastTimestamp.clear();
  },

  push(rawFrame: RecordingFrame) {
    const prev = lastTimestamp.get(rawFrame.deviceKey) ?? 0;
    // Advance by at least 1ms if the clock hasn't moved
    const timestamp = Math.max(prev + 1, rawFrame.timestamp);
    const frame: RecordingFrame = { ...rawFrame, timestamp };
    lastTimestamp.set(frame.deviceKey, timestamp);
    frames.push(frame);
    listeners.forEach((fn) => fn(frame));
  },

  getFrames() {
    return frames;
  },

  subscribe(fn: FrameListener): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
