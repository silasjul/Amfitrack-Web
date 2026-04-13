"use client";

import { type DeviceFrequency } from "@/amfitrackWebSDK/AmfitrackWeb";
import { PayloadType } from "@/amfitrackWebSDK/packets/PacketDecoder";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

export function FrequencyHoverCard({
  frequency,
  children,
  side = "left",
  align = "start",
}: {
  frequency?: DeviceFrequency;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}) {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side={side} align={align} className="w-48 p-2">
        <FrequencyBreakdown frequency={frequency} />
      </HoverCardContent>
    </HoverCard>
  );
}

const PAYLOAD_TYPE_LABELS: Record<number, string> = {
  [PayloadType.EMF_IMU_FRAME_ID]: "EMF/IMU Frame",
  [PayloadType.SOURCE_MEASUREMENT]: "Source Measurement",
  [PayloadType.SOURCE_CALIBRATION]: "Source Calibration",
  [PayloadType.COMMON]: "Common",
  [PayloadType.NOT_IMPLEMENTED]: "Unknown",
};

export function FrequencyBreakdown({
  frequency,
}: {
  frequency?: DeviceFrequency;
}) {
  const total = frequency?.totalHz ?? 0;
  const entries = Object.entries(frequency?.byPayloadType ?? {})
    .filter(([, hz]) => hz != null && hz > 0)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-popover-foreground">
          Message Frequency
        </span>
        <span className="text-[11px] font-mono tabular-nums text-popover-foreground/70">
          {total.toFixed(1)} Hz
        </span>
      </div>
      {entries.length > 0 && (
      <div className="border-t border-border/40 pt-1 space-y-0.5">
        {entries.map(([typeKey, hz]) => {
          const label =
            PAYLOAD_TYPE_LABELS[Number(typeKey)] ??
            `0x${Number(typeKey).toString(16)}`;
          const pct = total > 0 ? ((hz ?? 0) / total) * 100 : 0;
          return (
            <div
              key={typeKey}
              className="flex items-center justify-between gap-2"
            >
              <span className="text-[10px] text-popover-foreground/60 truncate">
                {label}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono tabular-nums text-popover-foreground/50">
                  {pct.toFixed(0)}%
                </span>
                <span className="text-[10px] font-mono tabular-nums text-popover-foreground/70">
                  {(hz ?? 0).toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
