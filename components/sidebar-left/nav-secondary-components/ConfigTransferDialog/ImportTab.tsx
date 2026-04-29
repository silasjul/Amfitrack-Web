import { TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ImportFileUpload from "@/components/file-upload-dropzone-1";
import ImportDeviceRow from "./ImportDeviceRow";
import { Loader2, RefreshCcw, Upload, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDeviceStore } from "@/amfitrackSDK";
import useTxIds from "@/hooks/useTxIds";
import { parseConfigCSV, type DeviceExportData } from "@/lib/csv";
import { useImportConfigurations } from "@/hooks/useImportConfigurations";
import { toast } from "sonner";

type Phase = "idle" | "decoding" | "ready";

export default function ImportTab() {
  const { allTxIds } = useTxIds();
  const deviceMeta = useDeviceStore((s) => s.deviceMeta);

  const [phase, setPhase] = useState<Phase>("idle");
  const [configs, setConfigs] = useState<DeviceExportData[]>([]);
  const [selections, setSelections] = useState<Record<number, string>>({});

  const { isImporting, progress, applyConfigurations } =
    useImportConfigurations();

  const processingRef = useRef(false);

  const handleFileAccepted = useCallback(
    async (file: File) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setPhase("decoding");
      try {
        const text = await file.text();
        const parsed = parseConfigCSV(text);
        if (parsed.length === 0) {
          toast.error("Invalid config file", {
            description: "No device configurations found in the file.",
          });
          setPhase("idle");
          processingRef.current = false;
          return;
        }

        setConfigs(parsed);

        const initial: Record<number, string> = {};
        for (const txId of allTxIds) {
          const deviceUuid = deviceMeta[txId]?.uuid;
          if (!deviceUuid) continue;
          const matchIdx = parsed.findIndex((c) => c.uuid === deviceUuid);
          if (matchIdx !== -1) {
            initial[txId] = String(matchIdx);
          }
        }
        setSelections(initial);
        setPhase("ready");
      } catch {
        toast.error("Failed to read config file");
        setPhase("idle");
      } finally {
        processingRef.current = false;
      }
    },
    [allTxIds, deviceMeta],
  );

  useEffect(() => {
    if (phase !== "ready") return;
    const updated: Record<number, string> = {};
    for (const txId of allTxIds) {
      if (selections[txId] !== undefined) {
        updated[txId] = selections[txId];
        continue;
      }
      const deviceUuid = deviceMeta[txId]?.uuid;
      if (!deviceUuid) continue;
      const matchIdx = configs.findIndex((c) => c.uuid === deviceUuid);
      if (matchIdx !== -1) {
        updated[txId] = String(matchIdx);
      }
    }
    setSelections(updated);
    // Only re-run when the connected device list changes
  }, [allTxIds]);

  const handleSelectConfig = useCallback(
    (txId: number, configIndex: string) => {
      setSelections((prev) => ({ ...prev, [txId]: configIndex }));
    },
    [],
  );

  const hasAnySelection = useMemo(
    () => Object.values(selections).some((v) => v !== undefined && v !== ""),
    [selections],
  );

  const handleApply = useCallback(async () => {
    const assignments = new Map<number, DeviceExportData>();
    for (const [txIdStr, configIdx] of Object.entries(selections)) {
      if (configIdx === "") continue;
      const idx = Number(configIdx);
      if (Number.isNaN(idx) || !configs[idx]) continue;
      assignments.set(Number(txIdStr), configs[idx]);
    }
    if (assignments.size === 0) return;
    await applyConfigurations(assignments);
  }, [selections, configs, applyConfigurations]);

  const progressPercent =
    progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  return (
    <TabsContent value="Import" className="flex min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {phase === "idle" && (
          <ImportFileUpload accept=".csv" onFileAccepted={handleFileAccepted} />
        )}

        {phase === "decoding" && (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Decoding config file…
            </p>
          </div>
        )}

        {phase === "ready" && (
          <>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPhase("idle");
                  setConfigs([]);
                  setSelections({});
                }}
                disabled={isImporting}
                className="-ml-2 leading-0"
              >
                <X className="h-4 w-4" />
                Change file
              </Button>
              <span className="text-sm text-muted-foreground">
                Assign loaded configs — {" "}
                {configs.map((c, i) => (
                  <span key={i}>
                    <Badge variant="secondary" className="font-normal">
                      {c.name || "Unnamed"}
                    </Badge>
                    {i < configs.length - 1 ? " " : ""}
                  </span>
                ))}
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full min-h-0 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>TX ID</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead>UUID</TableHead>
                      <TableHead>Config</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTxIds.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-10"
                        >
                          No devices connected
                        </TableCell>
                      </TableRow>
                    ) : (
                      allTxIds.map((txId) => (
                        <ImportDeviceRow
                          key={txId}
                          txId={txId}
                          meta={deviceMeta[txId]}
                          configs={configs}
                          selectedConfigIndex={selections[txId]}
                          onSelectConfig={handleSelectConfig}
                          disabled={isImporting}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            <div className="flex shrink-0 flex-col gap-3 pt-2">
              {isImporting && progress && (
                <div className="flex flex-col gap-1.5">
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">
                    {progress.current} / {progress.total} parameters
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  className="leading-0"
                  disabled={!hasAnySelection || isImporting}
                  onClick={handleApply}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Applying Configurations…
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Apply Configurations
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </TabsContent>
  );
}
