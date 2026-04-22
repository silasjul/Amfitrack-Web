"use client";

import Image from "next/image";
import { Bluetooth, Usb, CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAmfitrack, useDeviceStore } from "@/amfitrackSDK";
import { Button } from "@/components/ui/button";
import useTxIds from "@/hooks/useTxIds";
import type { DeviceKind } from "@/amfitrackSDK/src/interfaces/IStore";

const KIND_IMAGE: Partial<Record<DeviceKind, string>> = {
  hub: "/hub.png",
  source: "/source.png",
  sensor: "/sensor.png",
};

export default function Footer() {
  const { sdk } = useAmfitrack();
  const deviceMeta = useDeviceStore((s) => s.deviceMeta);

  const { BLETxIds, USBTxIds } = useTxIds();

  const hasTransports = BLETxIds.length > 0 || USBTxIds.length > 0;

  return (
    <div className="flex flex-col px-1 pb-1">
      {hasTransports && (
        <ul className="flex flex-col gap-1 mb-2">
          {BLETxIds.map((id) => {
            const meta = deviceMeta[id];
            return (
              <TransportItem
                key={id}
                kind={meta?.kind}
                txId={id}
                linkIcon={<Bluetooth />}
              />
            );
          })}
          {USBTxIds.map((id) => {
            const meta = deviceMeta[id];
            return (
              <TransportItem
                key={id}
                kind={meta?.kind}
                txId={id}
                linkIcon={<Usb />}
              />
            );
          })}
        </ul>
      )}
      <div className="flex items-center gap-2 mt-1 text-sidebar-foreground/80">
        <Button
          className="flex-1 flex items-center gap-1 justify-center"
          onClick={() => sdk?.requestConnectionViaUSB()}
          variant="outline"
          size="icon"
        >
          <Usb className="size-3.5 text-sidebar-foreground/60" />
          <span className="flex flex-col items-start leading-tight">
            <span className="text-xs font-medium">Connect USB</span>
          </span>
        </Button>
        <Button
          className="flex-1 flex items-center gap-1 justify-center"
          onClick={() => sdk?.requestConnectionViaBLE()}
          variant="outline"
          size="icon"
        >
          <Bluetooth className="size-3.5 text-sidebar-foreground/60" />
          <span className="flex flex-col items-start leading-tight">
            <span className="text-xs font-medium">Connect BLE</span>
          </span>
        </Button>
      </div>
    </div>
  );
}

function TransportItem({
  kind,
  txId,
  linkIcon,
}: {
  kind: DeviceKind;
  txId: number;
  linkIcon: React.ReactNode;
}) {
  const imageSrc = KIND_IMAGE[kind];
  return (
    <li
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-1",
        "ring-1 ring-transparent transition-[width,height,padding]",
        "hover:bg-white/4 hover:ring-sidebar-foreground/5",
      )}
    >
      <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-sidebar-foreground/10 bg-black/40 text-sidebar-foreground/40">
        {kind !== "unknown" ? (
          <Image
            src={imageSrc!}
            alt={kind}
            width={20}
            height={20}
            className="object-contain opacity-90"
          />
        ) : (
          <CircleHelp className="size-4" />
        )}
        <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-xs font-medium text-sidebar-foreground/90">
          {String(kind).charAt(0).toUpperCase() + String(kind).slice(1)}
        </span>
        <span className="truncate font-mono text-[10px] text-sidebar-foreground/40">
          ID {txId}
        </span>
      </div>

      <span className="flex shrink-0 items-center justify-center text-sidebar-foreground/55 size-3">
        {linkIcon}
      </span>
    </li>
  );
}
