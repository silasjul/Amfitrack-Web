import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import React, { useState } from "react";
import DeviceTable from "./DeviceTable";
import { Download, Loader2 } from "lucide-react";
import { useExport } from "@/hooks/useExport";
import { useAmfitrack, useDeviceStore } from "@/amfitrackSDK";
import useTxIds from "@/hooks/useTxIds";

export default function ExportTab() {
  const { allTxIds } = useTxIds();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const { sdk } = useAmfitrack();
  const deviceMeta = useDeviceStore((s) => s.deviceMeta);

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(allTxIds) : new Set());
  }

  function toggleRow(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  const { exportProgress, isExporting, handleDownload } = useExport(
    sdk,
    deviceMeta,
  );

  return (
    <TabsContent value="Export" className="flex min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 transition-[filter] duration-200">
        <div className="min-h-0 flex-1 overflow-hidden">
          <DeviceTable
            allIds={allTxIds}
            deviceMeta={deviceMeta}
            selectedIds={selectedIds}
            onToggleAll={toggleAll}
            onToggleRow={toggleRow}
          />
        </div>
        <div className="flex shrink-0 justify-end pt-2">
          <Button
            className="leading-0 flex"
            disabled={selectedIds.size === 0 || isExporting}
            onClick={() => handleDownload(Array.from(selectedIds))}
          >
            {isExporting && exportProgress ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting {exportProgress.current}/{exportProgress.total}
                ...
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
    </TabsContent>
  );
}
