"use client";

import { useProgress } from "@react-three/drei";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const FADE_OUT_MS = 400;
const LERP_SPEED = 6;

interface R3fLoaderProps {
  label?: string;
  className?: string;
}

export default function R3fLoader({
  label = "Loading scene",
  className,
}: R3fLoaderProps) {
  const { active, progress, loaded, total } = useProgress();
  const [visible, setVisible] = useState(true);
  const [displayed, setDisplayed] = useState(0);
  const targetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Target progress is monotonic within a load session — drei drops the ratio
  // when new assets enter the queue mid-load, but the user-facing value should
  // only ever advance. Reset when a fresh session starts (progress back to 0).
  useEffect(() => {
    if (progress === 0 && targetRef.current >= 100) {
      targetRef.current = 0;
      setDisplayed(0);
      return;
    }
    if (progress > targetRef.current) targetRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const tick = (now: number) => {
      const last = lastTimeRef.current ?? now;
      const dt = (now - last) / 1000;
      lastTimeRef.current = now;

      setDisplayed((prev) => {
        const target = targetRef.current;
        if (Math.abs(target - prev) < 0.05) return target;
        const t = 1 - Math.exp(-LERP_SPEED * dt);
        return prev + (target - prev) * t;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (active) {
      setVisible(true);
      return;
    }
    const t = window.setTimeout(() => setVisible(false), FADE_OUT_MS);
    return () => window.clearTimeout(t);
  }, [active]);

  if (!visible) return null;

  const pct = Math.round(displayed);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={active}
      className={cn(
        "pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300",
        active ? "opacity-100" : "opacity-0",
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
              {pct}%
            </span>
          </div>
          <Progress value={pct} className="h-1.5" />
          <p className="text-xs text-muted-foreground tabular-nums">
            {loaded} / {total} assets
          </p>
        </div>
      </div>
    </div>
  );
}
