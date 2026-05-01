"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, LineSeries, ColorType } from "lightweight-charts";
import type { UTCTimestamp } from "lightweight-charts";
import { recordingSession } from "@/lib/recordingEmitter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FieldDef } from "./chartConfig";

interface RecordingChartProps {
  deviceKey: string;
  sectionLabel: string;
  fields: FieldDef[];
}

function toValue(raw: unknown): number | null {
  if (typeof raw === "boolean") return raw ? 1 : 0;
  if (typeof raw === "number" && isFinite(raw)) return raw;
  return null;
}

export default function RecordingChart({
  deviceKey,
  sectionLabel,
  fields,
}: RecordingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesMap = useRef(new Map<string, any>());
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(new Set());

  const startTimeSecRef = useRef<number | null>(null);

  // Create chart once on mount, resize via ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const fmtElapsed = (timeSec: number) => {
      const start = startTimeSecRef.current ?? timeSec;
      const elapsedMs = Math.max(0, Math.round((timeSec - start) * 1000));
      const ms = elapsedMs % 1000;
      const totalSec = Math.floor(elapsedMs / 1000);
      const sec = totalSec % 60;
      const min = Math.floor(totalSec / 60);
      return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
    };

    const chart = createChart(el, {
      layout: {
        attributionLogo: false,
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa",
      },
      grid: {
        vertLines: { color: "#27272a" },
        horzLines: { color: "#27272a" },
      },
      width: el.clientWidth,
      height: el.clientHeight || 200,
      timeScale: {
        borderColor: "#3f3f46",
        tickMarkFormatter: (timeSec: number) => {
          const start = startTimeSecRef.current ?? timeSec;
          const elapsedSec = Math.max(0, timeSec - start);
          const totalSec = Math.floor(elapsedSec);
          const sec = totalSec % 60;
          const min = Math.floor(totalSec / 60);
          return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
        },
      },
      localization: {
        timeFormatter: fmtElapsed,
      },
      rightPriceScale: { borderColor: "#3f3f46" },
      crosshair: { mode: 1 },
    });

    const priceFormatter = (price: number) =>
      price % 1 === 0 ? price.toFixed(0) : price.toFixed(3);

    for (const { field, color } of fields) {
      const series = chart.addSeries(LineSeries, {
        color,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        priceFormat: { type: "custom", formatter: priceFormatter, minMove: 0.01 },
      });
      seriesMap.current.set(field, series);
    }

    const existing = recordingSession
      .getFrames()
      .filter((f) => f.deviceKey === deviceKey);

    if (existing.length > 0) {
      startTimeSecRef.current = existing[0].timestamp / 1000;
    }

    for (const { field } of fields) {
      const series = seriesMap.current.get(field);
      if (!series) continue;
      const data = existing
        .map((f) => {
          const v = toValue(f.data[field]);
          return v !== null
            ? { time: (f.timestamp / 1000) as UTCTimestamp, value: v }
            : null;
        })
        .filter(Boolean) as { time: UTCTimestamp; value: number }[];
      if (data.length > 0) series.setData(data);
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      chart.applyOptions({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      seriesMap.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live updates
  useEffect(() => {
    return recordingSession.subscribe((frame) => {
      if (frame.deviceKey !== deviceKey) return;
      if (startTimeSecRef.current === null) {
        startTimeSecRef.current = frame.timestamp / 1000;
      }
      for (const { field } of fields) {
        const v = toValue(frame.data[field]);
        if (v === null) continue;
        seriesMap.current.get(field)?.update({
          time: (frame.timestamp / 1000) as UTCTimestamp,
          value: v,
        });
      }
    });
  }, [deviceKey, fields]);

  const toggleField = (field: string) => {
    setHiddenFields((prev) => {
      const next = new Set(prev);
      const hiding = !next.has(field);
      hiding ? next.add(field) : next.delete(field);
      seriesMap.current.get(field)?.applyOptions({ visible: !hiding });
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
        <span className="text-xs font-semibold text-foreground/80">
          {deviceKey.replace("_", " #").toUpperCase()} — {sectionLabel}
        </span>
        <div className="flex gap-1">
          {fields.map(({ field, label, color }) => (
            <Button
              key={field}
              variant="outline"
              size="sm"
              onClick={() => toggleField(field)}
              className={cn(
                "h-6 px-2.5 text-xs font-medium transition-opacity",
                hiddenFields.has(field) ? "opacity-25" : "opacity-100",
              )}
              style={{ borderColor: color, color }}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}
