"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FLOATING_RECORDING_BAR_ATTR } from "./FloatingRecordingBar";

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
        className="sm:max-w-2xl"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest(`[${FLOATING_RECORDING_BAR_ATTR}]`))
            e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Recording Data</DialogTitle>
          <DialogDescription>Live chart will appear here.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
