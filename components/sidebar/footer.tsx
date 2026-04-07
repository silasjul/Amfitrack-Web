"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAmfitrack } from "@/hooks/useAmfitrack";
import { cn } from "@/lib/utils";
import { Unplug, Plus } from "lucide-react";
import { SidebarGroupLabel } from "../ui/sidebar";

interface DeviceCardProps {
  name: string;
  image: string;
  connected: boolean;
  onConnect: () => void;
}

function DeviceCard({ name, image, connected, onConnect }: DeviceCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => !connected && onConnect()}
      disabled={connected}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex items-center gap-3 rounded-md p-2.5 text-left transition-all duration-200",
        connected
          ? "bg-sidebar-accent cursor-default"
          : "cursor-pointer border-muted-foreground/25 bg-transparent active:scale-[0.98]",
        !connected &&
          hovered &&
          "border-muted-foreground/40 bg-sidebar-accent/60",
      )}
    >
      {/* Device thumbnail */}
      <div
        className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border transition-all duration-200",
          connected
            ? "border-emerald-500/20 bg-black/40"
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
        <span className="text-sm font-medium text-sidebar-foreground">
          {name}
        </span>
        {connected ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.4)]" />
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
      {!connected && (
        <div
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed transition-all duration-200",
            hovered
              ? "border-muted-foreground/40 bg-muted-foreground/10"
              : "border-muted-foreground/20",
          )}
        >
          <span
            className={cn(
              "text-sm font-light leading-none transition-colors duration-200",
              hovered
                ? "text-sidebar-foreground/70"
                : "text-muted-foreground/40",
            )}
          >
            <Plus className="w-3 h-3" />
          </span>
        </div>
      )}
    </button>
  );
}

export default function Footer() {
  const {
    hubConnected,
    sourceConnected,
    requestConnectionHub,
    requestConnectionSource,
  } = useAmfitrack();

  return (
    <div>
      <SidebarGroupLabel>Devices</SidebarGroupLabel>
      <div className="flex flex-col gap-1.5 px-1 pb-1">
        <DeviceCard
          name="Hub"
          image="/hub.png"
          connected={hubConnected}
          onConnect={requestConnectionHub}
        />
        <DeviceCard
          name="Source"
          image="/source.png"
          connected={sourceConnected}
          onConnect={requestConnectionSource}
        />
      </div>
    </div>
  );
}
