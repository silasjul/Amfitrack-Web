"use client";

import Image from "next/image";
import {
  Bluetooth,
  Usb,
  CircleHelp,
  ChevronRight,
  Plug,
  Plus,
} from "lucide-react";
import { useAmfitrack, useDeviceStore } from "@/amfitrackSDK";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    <Card size="sm" className="light opacity-95">
      <CardHeader>
        <CardTitle className="flex items-center gap-1 leading-none">
          Connect device
          <ChevronRight
            className="size-3.5 shrink-0 text-sidebar-foreground/80"
            aria-hidden
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0">
        <div className="flex gap-1 opacity-100">
          <Button
            className="flex-1 flex items-center gap-1 justify-center"
            onClick={() => sdk?.requestConnectionViaUSB()}
            variant="outline"
            size="icon"
          >
            <Usb className="size-3.5 text-sidebar-foreground" />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-xs font-medium">USB</span>
            </span>
          </Button>
          <Button
            className="flex-1 flex items-center gap-1 justify-center"
            onClick={() => sdk?.requestConnectionViaBLE()}
            variant="outline"
            size="icon"
          >
            <Bluetooth className="size-3.5 text-sidebar-foreground/80" />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-xs font-medium">Bluetooth</span>
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
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
    <li className="min-w-0 list-none">
      <Card size="sm">
        <CardContent className="flex items-center gap-2.5">
          <Badge
            variant="secondary"
            className="size-8 shrink-0 rounded-md p-0 shadow-none"
          >
            {kind !== "unknown" ? (
              <Image
                src={imageSrc!}
                alt={kind}
                width={20}
                height={20}
                className="size-5 object-contain opacity-90"
              />
            ) : (
              <span className="flex size-full items-center justify-center">
                <CircleHelp className="size-4 text-sidebar-foreground/70" />
              </span>
            )}
          </Badge>

          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-xs font-medium text-sidebar-foreground/90">
              {String(kind).charAt(0).toUpperCase() + String(kind).slice(1)}
            </span>
            <span className="truncate text-[10px] text-sidebar-foreground/40">
              ID {txId}
            </span>
          </div>

          <span className="flex size-3 shrink-0 items-center justify-center text-sidebar-foreground/55">
            {linkIcon}
          </span>
        </CardContent>
      </Card>
    </li>
  );
}
