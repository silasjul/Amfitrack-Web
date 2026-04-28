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
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, Loader2 } from "lucide-react";
import useTxIds from "@/hooks/useTxIds";
import { useDeviceStore } from "@/amfitrackSDK/src/store/useDeviceStore";
import { useAmfitrack } from "@/amfitrackSDK";
import DeviceTable from "./DeviceTable";
import { useExport } from "./useExport";
import { useFileDragDrop } from "./useFileDragDrop";

export default function ConfigTransferDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { sensorTxIds, sourceTxIds, hubTxIds, unknownTxIds } = useTxIds();
  const deviceMeta = useDeviceStore((s) => s.deviceMeta);
  const { sdk } = useAmfitrack();

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

  const { exportProgress, isExporting, handleDownload } = useExport(sdk, deviceMeta);
  const { isDragging, onDialogDrop } = useFileDragDrop(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-5xl flex flex-col overflow-hidden"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDialogDrop}
      >
        <div
          className="flex flex-col gap-4 transition-[filter] duration-200"
          style={{ filter: isDragging ? "blur(4px)" : "none" }}
          aria-hidden={isDragging}
        >
          <Header />
          <DeviceTable
            allIds={allIds}
            deviceMeta={deviceMeta}
            selectedIds={selectedIds}
            onToggleAll={toggleAll}
            onToggleRow={toggleRow}
          />
          <div className="flex justify-end pt-2">
            <Button
              className="leading-0"
              disabled={selectedIds.size === 0 || isExporting}
              onClick={() => handleDownload(Array.from(selectedIds))}
            >
              {isExporting && exportProgress ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting {exportProgress.current}/{exportProgress.total}...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Configurations
                </>
              )}
            </Button>
          </div>
        </div>

        {isDragging && <DropOverlay />}
      </DialogContent>
    </Dialog>
  );
}

function Header() {
  return (
    <DialogHeader>
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <DialogTitle>Config Transfer</DialogTitle>
          <DialogDescription>
            Export or import configurations between devices.
          </DialogDescription>
        </div>
        <Button className="leading-0" variant="outline" size="sm">
          <Upload className="mr-1 h-4 w-4" />
          Import CSV
        </Button>
      </div>
    </DialogHeader>
  );
}

function DropOverlay() {
  return (
    <Card className="border-dashed border-2 border-primary absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-background/60">
      <CardHeader className="items-center">
        <Upload className="h-10 w-10 text-primary" />
        <CardTitle>Drop CSV to import</CardTitle>
        <CardDescription>Release to import configuration file</CardDescription>
      </CardHeader>
    </Card>
  );
}
