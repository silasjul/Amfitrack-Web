"use client";

import { useProgress } from "@react-three/drei";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface R3fLoaderProps {
  label?: string;
  className?: string;
}

export default function R3fLoader({
  label = "Loading scene",
  className,
}: R3fLoaderProps) {
  const { active, progress, loaded, total } = useProgress();

  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={active}
      className={cn(
        "pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex w-[min(22rem,80vw)] flex-col items-center gap-6 rounded-2xl border bg-card/90 px-8 py-7 shadow-lg">
        <div className="relative">
          <Image
            src="/logo.svg"
            alt="Amfitrack"
            width={64}
            height={64}
            priority
            className="animate-pulse rounded-full"
          />
        </div>

        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{label}</span>
            <span className="font-mono text-muted-foreground tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground tabular-nums">
            {loaded} / {total} assets
          </p>
        </div>
      </div>
    </div>
  );
}
