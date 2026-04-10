"use client";

import { useAmfitrack } from "@/hooks/useAmfitrack";
import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getDistortionLevel } from "@/config/distortion";
import { type EmfImuFrameIdData } from "@/amfitrackWebSDK/packets/decoders";
import { ScrollArea } from "@/components/ui/scroll-area";

const POSITION_SCALE = 100;
interface Props {
  selectedSensorId: number | null;
}

export default function SidebarLower({ selectedSensorId }: Props) {
  const { sensorsDataRef } = useAmfitrack();
  const [data, setData] = useState<EmfImuFrameIdData | null>(null);

  useEffect(() => {
    if (selectedSensorId === null) {
      setData(null);
      return;
    }

    const readSensor = () => {
      const entry = sensorsDataRef.current.get(selectedSensorId);
      if (!entry) return;
      setData({
        ...entry,
        position: {
          x: entry.position.x * POSITION_SCALE,
          y: entry.position.y * POSITION_SCALE,
          z: entry.position.z * POSITION_SCALE,
        },
        quaternion: {
          x: entry.quaternion.x,
          y: entry.quaternion.y,
          z: entry.quaternion.z,
          w: entry.quaternion.w,
        },
      });
    };

    readSensor();
    const interval = setInterval(readSensor, 100);

    return () => clearInterval(interval);
  }, [selectedSensorId, sensorsDataRef]);

  return (
    <div className="flex w-full h-full pl-1 pr-1 pt-0.5">
      <ScrollArea className="flex-1 flex flex-col bg-sidebar rounded-t-sm overflow-hidden">
        {selectedSensorId === null ? (
          <EmptyState />
        ) : !data ? (
          <DetailSkeleton />
        ) : (
          <>
            <DetailHeader
              label={`SENSOR_ID: ${selectedSensorId}`}
              distortion={data.metalDistortion}
            />
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
              <Section title="Position">
                <div className="grid grid-cols-3 gap-1.5">
                  <ValueCell label="X" value={data.position.x.toFixed(2)} />
                  <ValueCell label="Y" value={data.position.y.toFixed(2)} />
                  <ValueCell label="Z" value={data.position.z.toFixed(2)} />
                </div>
              </Section>

              <Section title="Orientation">
                <div className="grid grid-cols-4 gap-1.5">
                  <ValueCell label="X" value={data.quaternion.x.toFixed(3)} />
                  <ValueCell label="Y" value={data.quaternion.y.toFixed(3)} />
                  <ValueCell label="Z" value={data.quaternion.z.toFixed(3)} />
                  <ValueCell label="W" value={data.quaternion.w.toFixed(3)} />
                </div>
              </Section>

              <Section title="Accelerometer" unit="g">
                <div className="grid grid-cols-3 gap-1.5">
                  <ValueCell label="X" value={data.imu.acc_x.toFixed(2)} />
                  <ValueCell label="Y" value={data.imu.acc_y.toFixed(2)} />
                  <ValueCell label="Z" value={data.imu.acc_z.toFixed(2)} />
                </div>
              </Section>

              <Section title="Gyroscope" unit="°/s">
                <div className="grid grid-cols-3 gap-1.5">
                  <ValueCell label="X" value={data.imu.gyro_x.toFixed(1)} />
                  <ValueCell label="Y" value={data.imu.gyro_y.toFixed(1)} />
                  <ValueCell label="Z" value={data.imu.gyro_z.toFixed(1)} />
                </div>
              </Section>

              <Section title="Magnetometer">
                <div className="grid grid-cols-3 gap-1.5">
                  <ValueCell label="X" value={data.magneto.mag_x.toFixed(1)} />
                  <ValueCell label="Y" value={data.magneto.mag_y.toFixed(1)} />
                  <ValueCell label="Z" value={data.magneto.mag_z.toFixed(1)} />
                </div>
              </Section>

              <Section title="Environment">
                <div className="grid grid-cols-2 gap-1.5">
                  <ValueCell
                    label="Temp"
                    value={`${data.temperature.toFixed(1)}°C`}
                  />
                  <DistortionCell distortion={data.metalDistortion} />
                  <ValueCell label="RSSI" value={String(data.rssi)} />
                  <ValueCell label="Frame" value={String(data.frameId)} />
                </div>
              </Section>

              <Section title="Device">
                <div className="grid grid-cols-2 gap-1.5">
                  <ValueCell
                    label="State"
                    value={`0x${data.sensorState.toString(16).padStart(2, "0").toUpperCase()}`}
                  />
                  <ValueCell
                    label="Status"
                    value={`0x${data.sensorStatus.toString(16).padStart(2, "0").toUpperCase()}`}
                  />
                  <ValueCell label="Coil" value={String(data.sourceCoilId)} />
                  <ValueCell label="Calc ID" value={String(data.calcId)} />
                </div>
              </Section>
            </div>
          </>
        )}
      </ScrollArea>
    </div>
  );
}

function DetailHeader({
  label,
  distortion,
}: {
  label: string;
  distortion: number;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border/30 shrink-0">
      <span className="text-xs font-semibold text-sidebar-foreground">
        {label}
      </span>
      <DistortionBadge distortion={distortion} />
    </div>
  );
}

function Section({
  title,
  unit,
  children,
}: {
  title: string;
  unit?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
          {title}
        </h4>
        {unit && (
          <span className="text-[9px] font-mono text-sidebar-foreground/25">
            {unit}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function ValueCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-sidebar-accent px-2 py-1.5">
      <div className="text-[9px] font-medium uppercase tracking-wider text-sidebar-foreground/30">
        {label}
      </div>
      <div className="text-[11px] font-mono tabular-nums text-sidebar-foreground/80 leading-tight mt-0.5">
        {value}
      </div>
    </div>
  );
}

function DistortionCell({ distortion }: { distortion: number }) {
  const pct = (distortion * 100).toFixed(0);
  const level = getDistortionLevel(distortion);
  const barColor = {
    clean: "bg-emerald-500",
    moderate: "bg-amber-500",
    high: "bg-red-500",
  }[level];

  return (
    <div className="rounded-md bg-sidebar-accent px-2 py-1.5">
      <div className="text-[9px] font-medium uppercase tracking-wider text-sidebar-foreground/30">
        Metal Distortion
      </div>
      <div className="text-[11px] font-mono tabular-nums text-sidebar-foreground/80 leading-tight mt-0.5">
        {pct}%
      </div>
      <div className="mt-1 h-1 rounded-full bg-sidebar-foreground/10 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            barColor,
          )}
          style={{ width: `${distortion * 100}%` }}
        />
      </div>
    </div>
  );
}

function DistortionBadge({ distortion }: { distortion: number }) {
  const level = getDistortionLevel(distortion);

  const config = {
    clean: {
      text: "Clean",
      className:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-500",
    },
    moderate: {
      text: "Moderate",
      className:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      dot: "bg-amber-500",
    },
    high: {
      text: "Distorted",
      className:
        "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      dot: "bg-red-500",
    },
  }[level];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
        config.className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", config.dot)} />
      {config.text}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <div className="mx-auto size-12 rounded-full bg-sidebar/60 flex items-center justify-center">
          <Radio className="size-5 text-sidebar-foreground/20" />
        </div>
        <p className="text-xs text-sidebar-foreground/30">
          Select a sensor to view details
        </p>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <>
      <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border/30 shrink-0">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <SkeletonSection cols={3} />
        <SkeletonSection cols={4} />
        <SkeletonSection cols={3} />
        <SkeletonSection cols={3} />
        <SkeletonSection cols={3} />
        <SkeletonSection cols={2} />
      </div>
    </>
  );
}

function SkeletonSection({ cols }: { cols: 2 | 3 | 4 }) {
  const gridClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[cols];

  return (
    <div>
      <Skeleton className="h-2.5 w-20 mb-2" />
      <div className={cn("grid gap-1.5", gridClass)}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-md" />
        ))}
      </div>
    </div>
  );
}
