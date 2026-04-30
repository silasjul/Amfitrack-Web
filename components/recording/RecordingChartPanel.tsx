"use client";

import { useMemo, useState } from "react";
import { useRecordingStore } from "@/stores/useRecordingStore";
import { useDeviceStore } from "@/amfitrackSDK/src/store/useDeviceStore";
import { cn } from "@/lib/utils";
import { CHARTABLE_FIELDS, SECTION_LABELS } from "./chartConfig";
import RecordingChart from "./RecordingChart";

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

  // Hide everything beyond the first MAX_VISIBLE by default
  const [hiddenCharts, setHiddenCharts] = useState<Set<string>>(
    () => new Set(items.slice(MAX_VISIBLE).map((i) => i.id)),
  );

  const visibleCount = items.filter((i) => !hiddenCharts.has(i.id)).length;

  const toggleChart = (id: string) =>
    setHiddenCharts((prev) => {
      const isHidden = prev.has(id);
      // Block showing if already at max
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

  return (
    <div className="flex h-full min-h-0 gap-4">
      {/* Sidebar — toggle which charts are shown */}
      <div className="w-44 shrink-0 flex flex-col gap-1 overflow-y-auto pr-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Charts{" "}
          <span className="normal-case font-normal">
            ({visibleCount}/{MAX_VISIBLE})
          </span>
        </p>
        {items.map((item) => {
          const hidden = hiddenCharts.has(item.id);
          const atMax = !hidden || visibleCount >= MAX_VISIBLE;
          return (
            <button
              key={item.id}
              onClick={() => toggleChart(item.id)}
              disabled={hidden && visibleCount >= MAX_VISIBLE}
              className={cn(
                "text-left px-2.5 py-1.5 rounded-md border text-xs transition-all",
                hidden
                  ? atMax
                    ? "opacity-20 border-transparent bg-transparent cursor-not-allowed"
                    : "opacity-35 border-transparent bg-transparent"
                  : "border-border bg-muted/50 text-foreground",
              )}
            >
              <span className="block font-medium leading-tight">
                {item.deviceKey.replace("_", " #").toUpperCase()}
              </span>
              <span className="text-muted-foreground leading-tight">
                {item.sectionLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Charts — each takes equal share of height via flex-1 */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 min-h-0">
        {visible.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            All charts hidden.
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
