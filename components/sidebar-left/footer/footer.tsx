"use client";

import Image from "next/image";
import { Plug, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAmfitrack, useDeviceStore } from "@/amfitrackSDK";
import { SidebarGroupLabel } from "@/components/ui/sidebar";

type ConnectedDevice = {
  key: string;
  label: string;
  id: number;
  image: string;
};

const KIND_LABEL: Record<string, string> = {
  hub: "Hub",
  source: "Source",
  sensor: "Sensor",
};

const KIND_IMAGE: Record<string, string> = {
  hub: "/hub.png",
  source: "/source.png",
  sensor: "/sensor.png",
};

export default function Footer() {
  const { sdk } = useAmfitrack();
  const deviceMeta = useDeviceStore((s) => s.deviceMeta);

  const connectedDevices: ConnectedDevice[] = [];
  for (const [txIdStr, meta] of Object.entries(deviceMeta)) {
    const txId = Number(txIdStr);
    if (txId < 0) continue;
    const isUsb =
      meta.readFromTxId === null || meta.readFromTxId === txId;
    if (!isUsb) continue;
    connectedDevices.push({
      key: `${meta.kind}-${txId}`,
      label: KIND_LABEL[meta.kind] ?? meta.kind,
      id: txId,
      image: KIND_IMAGE[meta.kind] ?? "/sensor.png",
    });
  }

  const hasDevices = connectedDevices.length > 0;

  return (
    <div className="flex flex-col px-1 pb-1">
      {hasDevices && (
        <SidebarGroupLabel className="mr-0 pr-1.5">
          USB Devices
        </SidebarGroupLabel>
      )}

      {hasDevices && (
        <ul className="flex flex-col gap-1 mb-2">
          {connectedDevices.map(({ key, label, id, image }) => (
            <li
              key={key}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1",
                "ring-1 ring-transparent transition-[width,height,padding]",
                "hover:bg-white/4 hover:ring-sidebar-foreground/5",
                "[&:hover_[data-device-icon]]:text-sidebar-foreground/55",
              )}
            >
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-sidebar-foreground/10 bg-black/40">
                <Image
                  src={image}
                  alt={label}
                  width={20}
                  height={20}
                  className="object-contain opacity-90"
                />
                <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-xs font-medium text-sidebar-foreground/90">
                  {label}
                </span>
                <span className="truncate font-mono text-[10px] text-sidebar-foreground/40">
                  ID {id}
                </span>
              </div>

              <Radio
                data-device-icon
                className="h-3 w-3 shrink-0 text-sidebar-foreground/30 transition-[width,height,padding]"
              />
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => sdk?.requestConnectionViaUSB()}
        className={cn(
          "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm",
          "border border-dashed border-sidebar-foreground/15 bg-transparent",
          "text-sidebar-foreground/60 transition-[width,height,padding]",
          "hover:border-sidebar-foreground/30 hover:bg-sidebar-foreground/8 hover:text-sidebar-foreground/90",
          "active:scale-[0.99]",
          "[&:hover_[data-connect-icon]]:bg-sidebar-foreground/12",
          "[&:hover_[data-connect-icon]]:text-sidebar-foreground/85",
        )}
      >
        <span
          data-connect-icon
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm",
            "bg-sidebar-foreground/5 text-sidebar-foreground/60",
            "transition-[width,height,padding]",
          )}
        >
          <Plug className="h-3 w-3" />
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-xs font-medium">Connect USB device</span>
        </span>
      </button>
    </div>
  );
}
