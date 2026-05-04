"use client";

import { CircleHelp } from "lucide-react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import type { ConfigItem } from "@/lib/configTooltipParser";

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/50 px-2 py-0.5 font-roboto-mono">
      <span className="text-[9px] uppercase tracking-wide font-semibold text-popover-foreground/40">
        {label}
      </span>
      <span
        className={"text-[10px] text-popover-foreground/75 font-roboto-mono"}
      >
        {value}
      </span>
    </span>
  );
}

export function ParameterConfigHoverCard({
  parameterName,
  config,
  side = "top",
  align = "end",
}: {
  parameterName: string;
  config: ConfigItem;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}) {
  const description = config.description.trim();
  const uid = `0x${config.uid.toString(16).toUpperCase().padStart(8, "0")}`;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex shrink-0 rounded-sm text-muted-foreground/35 hover:text-muted-foreground/70 transition-colors cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          aria-label={`Documentation for ${parameterName}`}
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        align={align}
        className="w-80 p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-border/50">
          <p className="text-[12px] font-semibold text-popover-foreground leading-tight">
            {parameterName}
          </p>
        </div>

        {/* Metadata */}
        <div className="px-3 pt-2 flex flex-wrap gap-1.5">
          <MetaPill label="Type" value={config.type} />
          <MetaPill label="UID" value={uid} />
          <MetaPill label="Mode" value={config.config_mode} />
        </div>

        {/* Description */}
        {description ? (
          <div className="px-3 py-2.5 max-h-48 overflow-y-auto">
            <p className="text-[11.5px] text-popover-foreground/85 whitespace-pre-wrap leading-relaxed">
              {description}
            </p>
          </div>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  );
}
