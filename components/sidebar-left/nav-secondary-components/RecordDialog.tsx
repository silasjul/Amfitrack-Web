"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function RecordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[75vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Record/Logging</DialogTitle>
          <DialogDescription>
            Record or log data from selected device(s).
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
