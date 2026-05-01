"use client";

import { useMemo, useState } from "react";
import { useRecordingStore } from "@/stores/useRecordingStore";
import { useDeviceStore } from "@/amfitrackSDK/src/store/useDeviceStore";
import { cn } from "@/lib/utils";
import { CHARTABLE_FIELDS, SECTION_LABELS } from "./chartConfig";
import RecordingChart from "./RecordingChart";
import { Check } from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";

const MAX_VISIBLE = 3;

interface ChartItem {
  id: string;
  deviceKey: string;
  sectionKey: string;
  sectionLabel: string;
  fields: (typeof CHARTABLE_FIELDS)[string];
}

export default function RecordingChartPanel() {
  const selection = useRecordingStore((s) => s.selection);
  const deviceMeta = useDeviceStore((s) => s.deviceMeta);

  const items = useMemo<ChartItem[]>(() => {
    const result: ChartItem[] = [];
    for (const [txIdStr, sections] of Object.entries(selection)) {
      const txId = Number(txIdStr);
      const meta = deviceMeta[txId];
      if (!meta) continue;
      const deviceKey = `${meta.kind}_${txId}`;
      for (const sectionKey of sections) {
        const fields = CHARTABLE_FIELDS[sectionKey];
        if (!fields) continue;
        result.push({
          id: `${deviceKey}_${sectionKey}`,
          deviceKey,
          sectionKey,
          sectionLabel: SECTION_LABELS[sectionKey] ?? sectionKey,
          fields,
        });
      }
    }
    return result;
  }, [selection, deviceMeta]);

  const [hiddenCharts, setHiddenCharts] = useState<Set<string>>(
    () => new Set(items.slice(MAX_VISIBLE).map((i) => i.id)),
  );

  const visibleCount = items.filter((i) => !hiddenCharts.has(i.id)).length;

  const toggleChart = (id: string) =>
    setHiddenCharts((prev) => {
      const isHidden = prev.has(id);
      if (isHidden && visibleCount >= MAX_VISIBLE) return prev;
      const next = new Set(prev);
      isHidden ? next.delete(id) : next.add(id);
      return next;
    });

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No data sections selected for recording.
      </div>
    );
  }

  const visible = items.filter((i) => !hiddenCharts.has(i.id));
  const atMax = visibleCount >= MAX_VISIBLE;

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar */}
      <div className="w-52 shrink-0 flex flex-col border-r border-border">
        <div className="px-4 pt-4 pb-3 flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider">
            Live Recording Data
          </p>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-xs font-medium leading-0">Charts</span>
            <Badge
              variant={atMax ? "default" : "secondary"}
              className="text-[10px] tabular-nums leading-0"
            >
              {visibleCount} / {MAX_VISIBLE}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {items.map((item) => {
            const isVisible = !hiddenCharts.has(item.id);
            const isDisabled = !isVisible && atMax;
            return (
              <button
                key={item.id}
                onClick={() => toggleChart(item.id)}
                disabled={isDisabled}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors w-full text-muted-foreground",
                  isVisible && "bg-accent text-accent-foreground",
                  isDisabled
                    ? "cursor-not-allowed"
                    : "hover:bg-muted hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    isVisible
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40 bg-transparent",
                  )}
                >
                  {isVisible && <Check className="h-2.5 w-2.5" />}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-xs font-medium leading-tight truncate">
                    {item.deviceKey[0].toUpperCase() + item.deviceKey.slice(1)}
                  </span>
                  <span className="text-xs leading-tight truncate opacity-70">
                    {item.sectionLabel}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 min-h-0 bg-background p-4">
        {visible.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a chart to view data.
          </div>
        ) : (
          visible.map((item) => (
            <RecordingChart
              key={item.id}
              deviceKey={item.deviceKey}
              sectionLabel={item.sectionLabel}
              fields={item.fields}
            />
          ))
        )}
      </div>
    </div>
  );
}
