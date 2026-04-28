"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import useTxIds from "@/hooks/useTxIds";
import { useDeviceStore } from "@/amfitrackSDK/src/store/useDeviceStore";
import DeviceTable from "./DeviceTable";

export default function ConfigTransferDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { sensorTxIds, sourceTxIds, hubTxIds, unknownTxIds } = useTxIds();
  const deviceMeta = useDeviceStore((s) => s.deviceMeta);

  const allIds = useMemo(
    () => [...sensorTxIds, ...sourceTxIds, ...hubTxIds, ...unknownTxIds],
    [sensorTxIds, sourceTxIds, hubTxIds, unknownTxIds],
  );

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(allIds) : new Set());
  }

  function toggleRow(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl flex flex-col">
        <DialogHeader>
          <DialogTitle>Config Transfer</DialogTitle>
          <DialogDescription>
            Export or import configurations between devices.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <span className="text-sm">
            {selectedIds.size > 0
              ? `${selectedIds.size} of ${allIds.length} device${allIds.length !== 1 ? "s" : ""} selected`
              : `${allIds.length} device${allIds.length !== 1 ? "s" : ""} connected`}
          </span>
          <Button className="leading-0" variant="outline" size="sm">
            <Upload className="mr-1 h-4 w-4" />
            Import CSV
          </Button>
        </div>

        <DeviceTable
          allIds={allIds}
          deviceMeta={deviceMeta}
          selectedIds={selectedIds}
          onToggleAll={toggleAll}
          onToggleRow={toggleRow}
        />

        <div className="flex justify-end pt-2 mt-auto">
          <Button className="leading-0" disabled={selectedIds.size === 0}>
            <Download className="h-4 w-4" />
            Export Configurations
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
