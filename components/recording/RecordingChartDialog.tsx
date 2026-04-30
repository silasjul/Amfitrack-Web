"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FLOATING_RECORDING_BAR_ATTR } from "./FloatingRecordingBar";
import RecordingChartPanel from "./RecordingChartPanel";

export default function RecordingChartDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-6xl h-[80vh] flex flex-col overflow-hidden"
        aria-describedby={undefined}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest(`[${FLOATING_RECORDING_BAR_ATTR}]`))
            e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Live Recording Data</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <RecordingChartPanel />
        </div>
      </DialogContent>
    </Dialog>
  );
}
