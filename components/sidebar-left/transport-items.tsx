"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { CircleHelp, MoreHorizontal, Settings, Unplug } from "lucide-react";
import { useDeviceStore, useAmfitrack } from "@/amfitrackSDK";
import type { Configuration } from "@/amfitrackSDK";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type {
  DeviceKind,
  DeviceMeta,
} from "@/amfitrackSDK/src/interfaces/IStore";
import DeviceSettingsDialog from "@/components/sidebar-left/footer-components/DeviceSettingsDialog";
import useTxIds from "@/hooks/useTxIds";

export const KIND_IMAGE: Partial<Record<DeviceKind, string>> = {
  hub: "/hub.png",
  source: "/source.png",
  sensor: "/sensor.png",
};

export default function TransportItems() {
  const { BLETxIds, USBTxIds } = useTxIds();
  const { sdk } = useAmfitrack();
  const deviceMeta = useDeviceStore((s) => s.deviceMeta);
  const [configDialogTxId, setConfigDialogTxId] = useState<number | null>(null);

  const handleDisconnect = useCallback(
    async (txId: number) => {
      try {
        await sdk?.disconnectDevice(txId);
      } catch (err) {
        console.error(`Failed to disconnect device ${txId}`, err);
      }
    },
    [sdk],
  );

  if (BLETxIds.length === 0 && USBTxIds.length === 0) {
    return null;
  }

  const dialogMeta: DeviceMeta | undefined =
    configDialogTxId !== null ? deviceMeta[configDialogTxId] : undefined;
  const dialogConfiguration: Configuration[] = dialogMeta?.configuration ?? [];
  const dialogDeviceName =
    configDialogTxId !== null && dialogMeta
      ? Label(dialogMeta.kind) + " " + configDialogTxId
      : "";

  return (
    <SidebarGroup className="">
      <SidebarGroupLabel>Connections</SidebarGroupLabel>
      <SidebarMenu>
        {BLETxIds.map((txId) => (
          <TransportItem
            key={txId}
            txId={txId}
            onOpenSettings={() => setConfigDialogTxId(txId)}
            onDisconnect={() => handleDisconnect(txId)}
          />
        ))}
        {USBTxIds.map((txId) => (
          <TransportItem
            key={txId}
            txId={txId}
            onOpenSettings={() => setConfigDialogTxId(txId)}
            onDisconnect={() => handleDisconnect(txId)}
          />
        ))}
      </SidebarMenu>

      <DeviceSettingsDialog
        open={configDialogTxId !== null}
        onOpenChange={(open) => {
          if (!open) setConfigDialogTxId(null);
        }}
        txId={configDialogTxId ?? 0}
        deviceName={dialogDeviceName}
        configuration={dialogConfiguration}
        loading={configDialogTxId !== null && !dialogMeta?.configuration}
      />
    </SidebarGroup>
  );
}

function TransportItem({
  txId,
  onOpenSettings,
  onDisconnect,
}: {
  txId: number;
  onOpenSettings: () => void;
  onDisconnect: () => void;
}) {
  const { isMobile } = useSidebar();
  const deviceMeta = useDeviceStore((s) => s.deviceMeta);
  const meta = deviceMeta[txId];

  if (!meta) return null;
  const { kind } = meta;
  const configurationLoaded = meta.configuration !== undefined;

  return (
    <DropdownMenu>
      <SidebarMenuItem>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            isActive={false}
            type="button"
            className="transition-colors ease-linear"
          >
            <DeviceIcon kind={kind} />
            <span className="min-w-0 flex-1 truncate">{Label(kind)}</span>
            <span className="flex shrink-0 items-center gap-1 text-sidebar-foreground/50">
              <MoreHorizontal className="size-4" />
            </span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={isMobile ? "bottom" : "right"}
          align={isMobile ? "end" : "start"}
          className="min-w-56 rounded-lg"
        >
          <DropdownMenuItem
            disabled={!configurationLoaded}
            onSelect={onOpenSettings}
          >
            <Settings />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={onDisconnect}>
            <Unplug />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </SidebarMenuItem>
    </DropdownMenu>
  );
}

function Label(kind: DeviceKind) {
  return String(kind).charAt(0).toUpperCase() + String(kind).slice(1);
}

export function DeviceIcon({ kind }: { kind: DeviceKind }) {
  return kind !== "unknown" && KIND_IMAGE[kind] ? (
    <span className="flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-md">
      <Image
        src={KIND_IMAGE[kind]}
        alt={kind}
        width={16}
        height={16}
        className={cn("size-4 object-contain", kind === "sensor" ? "brightness-200" : "brightness-150")}
      />
    </span>
  ) : (
    <CircleHelp className="text-sidebar-foreground/70 size-4" />
  );
}
