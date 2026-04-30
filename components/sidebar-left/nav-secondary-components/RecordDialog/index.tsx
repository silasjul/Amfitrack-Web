"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DeviceCards from "./DeviceCards";

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
          <DialogTitle>New Recording Session</DialogTitle>
          <DialogDescription>
            Start a new recording session to capture data from your devices.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex flex-col">
          <DeviceCards />
        </div>
      </DialogContent>
    </Dialog>
  );
}
