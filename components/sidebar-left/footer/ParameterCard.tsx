"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { usePendingConfigStore } from "@/stores/usePendingConfigStore";
import { ConfigItem } from "@/lib/configTooltipParser";
import { ParameterConfigHoverCard } from "./ParameterConfigHoverCard";

export default function ParameterCard({
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

  const pendingTextValue = pending?.valueToPush;
  const formattedValue =
    typeof value === "number"
      ? pendingTextValue !== undefined
        ? String(pendingTextValue)
        : Number.isInteger(value)
          ? value.toString()
          : value.toFixed(4)
      : typeof value === "string"
        ? pendingTextValue !== undefined
          ? String(pendingTextValue)
          : value
        : null;

  function handleSwitchChange(checked: boolean) {
    setLocalBool(checked);
    onValueChange?.(param.uid, param.name, value, checked);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const newValue = typeof value === "number" ? Number(raw) : raw;
    onValueChange?.(param.uid, param.name, value, newValue);
  }

  return (
    <Card size="sm" className="gap-1 py-2 bg-sidebar-accent">
      <CardHeader className="px-3 pb-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-roboto-mono min-w-0 flex-1 leading-tight">
            {param.name}
          </CardTitle>
          {configurationTooltip ? (
            <ParameterConfigHoverCard
              parameterName={param.name}
              config={configurationTooltip}
            />
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2">
        {typeof value === "boolean" ? (
          <div className="flex items-center">
            <Switch
              checked={localBool}
              onCheckedChange={handleSwitchChange}
              aria-label={param.name}
            />
          </div>
        ) : (
          <Input
            defaultValue={formattedValue ?? ""}
            onChange={handleInputChange}
            aria-label={param.name}
            className="font-mono text-sm font-medium h-8 px-2 opacity-80"
          />
        )}
      </CardContent>
    </Card>
  );
}
