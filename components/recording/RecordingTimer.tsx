"use client";

import { useEffect, useState } from "react";
import { useRecordingStore } from "@/stores/useRecordingStore";

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function RecordingTimer() {
  const startTime = useRecordingStore((s) => s.startTime);
  const accumulatedMs = useRecordingStore((s) => s.accumulatedMs);
  const isPaused = useRecordingStore((s) => s.isPaused);
  const [elapsed, setElapsed] = useState(accumulatedMs);

  useEffect(() => {
    if (isPaused || !startTime) {
      setElapsed(accumulatedMs);
      return;
    }
    const interval = setInterval(() => {
      setElapsed(accumulatedMs + (Date.now() - startTime));
    }, 500);
    return () => clearInterval(interval);
  }, [startTime, accumulatedMs, isPaused]);

  return (
    <span className="font-mono text-sm tabular-nums min-w-[42px]">
      {formatTime(elapsed)}
    </span>
  );
}
