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
        showCloseButton={false}
        className="sm:max-w-7xl h-[80vh] flex flex-col overflow-hidden p-0"
        aria-describedby={undefined}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest(`[${FLOATING_RECORDING_BAR_ATTR}]`))
            e.preventDefault();
        }}
      >
        <RecordingChartPanel />
      </DialogContent>
    </Dialog>
  );
}
