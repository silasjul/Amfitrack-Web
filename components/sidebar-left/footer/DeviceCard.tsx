import { useState } from "react";
import { cn } from "@/lib/utils";
import { Unplug, Plus } from "lucide-react";
import Image from "next/image";

interface DeviceCardProps {
  name: string;
  image: string;
  connectedCount: number;
  onConnect: () => void;
}

export default function DeviceCard({
  name,
  image,
  connectedCount,
  onConnect,
}: DeviceCardProps) {
  const [hovered, setHovered] = useState(false);
  const connected = connectedCount > 0;

  return (
    <button
      onClick={onConnect}
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
            {connectedCount} connected
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

      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
          connected
            ? hovered
              ? "border-sidebar-primary/40 bg-sidebar-primary/10"
              : "border-sidebar-primary/20"
            : hovered
              ? "border-muted-foreground/40 bg-muted-foreground/10"
              : "border-muted-foreground/20",
        )}
      >
        <Plus
          className={cn(
            "h-3 w-3 transition-colors duration-200",
            connected
              ? hovered
                ? "text-sidebar-primary/70"
                : "text-sidebar-primary/40"
              : hovered
                ? "text-sidebar-foreground/70"
                : "text-muted-foreground/40",
          )}
        />
      </div>
    </button>
  );
}
