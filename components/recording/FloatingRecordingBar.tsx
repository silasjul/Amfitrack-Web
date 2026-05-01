"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BarChart2, Download, Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecordingStore } from "@/stores/useRecordingStore";
import { useRecordingSession } from "@/hooks/useRecordingSession";
import { cn } from "@/lib/utils";
import RecordingTimer from "./RecordingTimer";
import RecordingChartDialog from "./RecordingChartDialog";

export const FLOATING_RECORDING_BAR_ATTR = "data-floating-recording-bar";

export default function FloatingRecordingBar() {
  const isRecording = useRecordingStore((s) => s.isRecording);
  const isPaused = useRecordingStore((s) => s.isPaused);
  const pauseRecording = useRecordingStore((s) => s.pauseRecording);
  const resumeRecording = useRecordingStore((s) => s.resumeRecording);
  const stopRecording = useRecordingStore((s) => s.stopRecording);
  const { downloadRecording } = useRecordingSession();
  const [mounted, setMounted] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  // chart closed by default
  useEffect(() => {
    if (isRecording) setChartOpen(false);
  }, [isRecording]);

  // pause/resume recording with space key
  useEffect(() => {
    if (!isRecording) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      isPaused ? resumeRecording() : pauseRecording();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isRecording, isPaused, pauseRecording, resumeRecording]);

  if (!isRecording || !mounted) return null;

  return createPortal(
    <>
      <div
        {...{ [FLOATING_RECORDING_BAR_ATTR]: "" }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-300"
      >
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background/80 backdrop-blur-lg shadow-lg px-4 py-2.5">
          <div
            className={cn(
              "size-2.5 rounded-full bg-red-500 shrink-0",
              !isPaused && "animate-pulse",
            )}
          />

          <RecordingTimer />

          <div className="w-px h-4 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={isPaused ? resumeRecording : pauseRecording}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? (
              <Play className="size-4" />
            ) : (
              <Pause className="size-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setChartOpen(!chartOpen)}
            title="View chart"
          >
            <BarChart2 className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={!isPaused}
            onClick={downloadRecording}
            title="Download CSV"
          >
            <Download className="size-4" />
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={stopRecording}
            title="Stop recording"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <RecordingChartDialog open={chartOpen} onOpenChange={setChartOpen} />
    </>,
    document.body,
  );
}
