"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import RecordingTable from "./RecordingTable";

export default function RecordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selection, setSelection] = useState<Record<number, string[]>>({});
  const hasSelection = Object.values(selection).some((s) => s.length > 0);

  const handleToggle = useCallback((txId: number, section: string) => {
    setSelection((prev) => {
      const curr = prev[txId] ?? [];
      const next = curr.includes(section)
        ? curr.filter((s) => s !== section)
        : [...curr, section];
      return { ...prev, [txId]: next };
    });
  }, []);

  const handleSetSections = useCallback(
    (txId: number, sections: string[]) => {
      setSelection((prev) => ({ ...prev, [txId]: sections }));
    },
    [],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[75vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>New Recording Session</DialogTitle>
          <DialogDescription>
            Select which data sections to capture per device. Use the column
            checkboxes to select across all devices at once.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex flex-col min-h-0 pt-2">
          <RecordingTable
            selection={selection}
            onToggle={handleToggle}
            onSetSections={handleSetSections}
          />
        </div>
        <DialogFooter>
          <Button disabled={!hasSelection}>Start Recording</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
