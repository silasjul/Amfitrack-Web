"use client";

import { useLayoutEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { usePendingConfigStore } from "@/stores/usePendingConfigStore";
import { ConfigItem } from "@/lib/configTooltipParser";
import { ParameterConfigHoverCard } from "./ParameterConfigHoverCard";

function formatStoreValue(value: number | boolean | string): string {
  if (typeof value === "number")
    return Number.isInteger(value) ? value.toString() : value.toFixed(4);
  if (typeof value === "string") return value;
  return "";
}

export default function ParameterRow({
  param,
  txId,
  onValueChange,
  configurationTooltip = undefined,
}: {
  param: { name: string; uid: number; value: number | boolean | string };
  txId: number;
  configurationTooltip?: ConfigItem;
  onValueChange?: (
    uid: number,
    parameterName: string,
    currentValue: number | boolean | string,
    newValue: number | boolean | string,
  ) => void;
}) {
  const pending = usePendingConfigStore((s) =>
    s.pending.find((c) => c.txId === txId && c.paramUid === param.uid),
  );

  const value = param.value;

  const [localBool, setLocalBool] = useState(
    typeof value === "boolean"
      ? pending
        ? (pending.valueToPush as boolean)
        : value
      : false,
  );

  const [localText, setLocalText] = useState<string | null>(
    pending && typeof value !== "boolean" ? String(pending.valueToPush) : null,
  );

  useLayoutEffect(() => {
    if (pending) return;
    setLocalText(null);
    if (typeof value === "boolean") setLocalBool(value);
  }, [pending, value]);

  const displayText = localText ?? formatStoreValue(value);

  function handleSwitchChange(checked: boolean) {
    setLocalBool(checked);
    onValueChange?.(param.uid, param.name, value, checked);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setLocalText(raw);
    const newValue = typeof value === "number" ? Number(raw) : raw;
    onValueChange?.(param.uid, param.name, value, newValue);
  }

  return (
    <div className="relative flex items-center justify-between gap-4 px-4 py-4 before:absolute before:left-4 before:right-4 before:top-0 before:h-px before:bg-border/60 first:before:hidden">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-roboto-mono text-sm font-medium leading-tight">
            {param.name}
          </span>
          {configurationTooltip ? (
            <ParameterConfigHoverCard
              parameterName={param.name}
              config={configurationTooltip}
            />
          ) : null}
        </div>
        {configurationTooltip?.description ? (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {configurationTooltip.description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">
        {typeof value === "boolean" ? (
          <Switch
            checked={localBool}
            onCheckedChange={handleSwitchChange}
            aria-label={param.name}
          />
        ) : (
          <Input
            value={displayText}
            onChange={handleInputChange}
            aria-label={param.name}
            className="font-mono text-sm font-medium h-8 w-36 px-2"
          />
        )}
      </div>
    </div>
  );
}
