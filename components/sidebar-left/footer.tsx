"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAmfitrack } from "@/hooks/useAmfitrack";
import { cn } from "@/lib/utils";
import { Unplug, Plus, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Configuration } from "@/amfitrackWebSDK/Configurator";

interface DeviceCardProps {
  name: string;
  image: string;
  connected: boolean;
  configuration: Configuration[];
  onConnect: () => void;
}

function DeviceCard({
  name,
  image,
  connected,
  configuration,
  onConnect,
}: DeviceCardProps) {
  const [hovered, setHovered] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClick = () => {
    if (connected) {
      setDialogOpen(true);
    } else {
      onConnect();
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "group relative flex items-center gap-3 rounded-md p-2.5 text-left transition-all duration-200",
          connected
            ? "bg-sidebar-accent cursor-pointer hover:bg-white/13"
            : "cursor-pointer bg-transparent active:scale-[0.98]",
          !connected &&
            hovered &&
            "border-muted-foreground/40 bg-sidebar-accent/60",
        )}
      >
        {/* Device thumbnail */}
        <div
          className={cn(
            "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border transition-all duration-200",
            connected
              ? "border-sidebar-primary/20 bg-black/40"
              : hovered
                ? "border-muted-foreground/30 bg-black/30"
                : "border-muted-foreground/15 bg-black/20",
          )}
        >
          <Image
            src={image}
            alt={name}
            width={32}
            height={32}
            className={cn(
              "object-contain transition-all duration-200",
              connected
                ? "opacity-100"
                : hovered
                  ? "opacity-70"
                  : "opacity-40 grayscale",
            )}
          />
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={cn(
              "text-sm font-medium transition-colors duration-200",
              connected
                ? "text-sidebar-foreground"
                : "text-sidebar-foreground/60",
            )}
          >
            {name}
          </span>
          {connected ? (
            <span className="flex items-center gap-1.5 text-xs text-sidebar-primary">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sidebar-primary opacity-80" />
              Connected
            </span>
          ) : (
            <span
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors duration-200",
                hovered
                  ? "text-sidebar-foreground/70"
                  : "text-muted-foreground/60",
              )}
            >
              <Unplug className="h-3 w-3" />
              Click to connect
            </span>
          )}
        </div>

        {/* Right-side indicator */}
        {connected ? (
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-200",
              "text-sidebar-foreground/30",
              hovered && "text-sidebar-foreground/60",
            )}
          >
            <Settings className="h-3.5 w-3.5" />
          </div>
        ) : (
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
              hovered
                ? "border-muted-foreground/40 bg-muted-foreground/10"
                : "border-muted-foreground/20",
            )}
          >
            <Plus
              className={cn(
                "h-3 w-3 transition-colors duration-200",
                hovered
                  ? "text-sidebar-foreground/70"
                  : "text-muted-foreground/40",
              )}
            />
          </div>
        )}
      </button>

      <DeviceSettingsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        deviceName={name}
        configuration={configuration}
      />
    </>
  );
}

function DeviceSettingsDialog({
  open,
  onOpenChange,
  deviceName,
  configuration,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceName: string;
  configuration: Configuration[];
}) {
  const defaultTab = configuration[0]?.name ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[75vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{deviceName} Settings</DialogTitle>
          <DialogDescription>
            Configuration parameters for the {deviceName.toLowerCase()} device.
          </DialogDescription>
        </DialogHeader>

        {configuration.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No configuration available.
          </p>
        ) : (
          <Tabs
            defaultValue={defaultTab}
            className="flex-1 min-h-0 flex flex-col"
          >
            <TabsList className="w-full shrink-0 h-10">
              {configuration.map((category) => (
                <TabsTrigger key={category.name} value={category.name}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <ScrollArea type="always" className="flex-1 min-h-0">
              {configuration.map((category) => (
                <TabsContent
                  key={category.name}
                  value={category.name}
                  className="mt-0 p-1"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 pt-1">
                    {category.parameters.map((param, idx) => (
                      <ParameterCard key={param.name + idx} param={param} />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ParameterCard({
  param,
}: {
  param: { name: string; uid: number; value: number | boolean | string };
}) {
  const value = param.value;
  const formattedValue =
    typeof value === "number"
      ? Number.isInteger(value)
        ? value.toString()
        : value.toFixed(4)
      : typeof value === "string"
        ? value
        : null;

  return (
    <Card size="sm" className="gap-1 py-2 bg-sidebar-accent">
      <CardHeader className="px-3 pb-0">
        <CardTitle className="font-roboto-mono">{param.name}</CardTitle>
      </CardHeader>
      <CardContent className="px-3">
        {typeof value === "boolean" ? (
          <div className="flex items-center">
            <Switch checked={value} aria-label={param.name} />
          </div>
        ) : (
          <Input
            readOnly
            value={formattedValue ?? ""}
            aria-label={param.name}
            className="font-mono text-sm font-medium h-8 px-2 opacity-80"
          />
        )}
        <span className="text-[10px] text-muted-foreground/60">
          {param.uid.toString(16).toUpperCase().padStart(8, "0")}
        </span>
      </CardContent>
    </Card>
  );
}

export default function Footer() {
  const {
    hubConnected,
    sourceConnected,
    hubConfiguration,
    sourceConfiguration,
    requestConnectionHub,
    requestConnectionSource,
  } = useAmfitrack();

  return (
    <div>
      <div className="flex flex-col gap-1.5 px-1 pb-1">
        <DeviceCard
          name="Hub"
          image="/hub.png"
          connected={hubConnected}
          configuration={hubConfiguration}
          onConnect={requestConnectionHub}
        />
        <DeviceCard
          name="Source"
          image="/source.png"
          connected={sourceConnected}
          configuration={sourceConfiguration}
          onConnect={requestConnectionSource}
        />
      </div>
    </div>
  );
}
