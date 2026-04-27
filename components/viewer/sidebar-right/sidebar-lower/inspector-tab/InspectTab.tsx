"use client";

import { useDeviceStore } from "@/amfitrackSDK";
import type {
  EmfImuFrameIdData,
  SourceMeasurementData,
  SourceCalibrationData,
  DeviceKind,
  DeviceFrequency,
  DeviceVersions,
} from "@/amfitrackSDK";
import { useViewerStore } from "@/stores/useViewerStore";
import useTxIds from "@/hooks/useTxIds";
import { useEffect, useState } from "react";
import { Radio, Router, CircleHelp } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getDistortionLevel } from "@/config/distortion";

export default function InspectTab() {
  const selectedDeviceId = useViewerStore((s) => s.selectedDeviceId);
  const setSelectedDeviceId = useViewerStore((s) => s.setSelectedDeviceId);
  const deviceMeta = useDeviceStore((s) => s.deviceMeta);
  const frequency = useDeviceStore((s) => s.frequency);
  const { sensorTxIds } = useTxIds();

  useEffect(() => {
    if (selectedDeviceId === null && sensorTxIds.length > 0) {
      setSelectedDeviceId(sensorTxIds[0]);
    } else if (
      selectedDeviceId !== null &&
      !Object.prototype.hasOwnProperty.call(deviceMeta, selectedDeviceId)
    ) {
      setSelectedDeviceId(sensorTxIds[0] ?? null);
    }
  }, [sensorTxIds, selectedDeviceId, setSelectedDeviceId, deviceMeta]);

  if (selectedDeviceId === null) return <EmptyState />;

  const meta = deviceMeta[selectedDeviceId];
  const kind: DeviceKind = meta?.kind ?? "unknown";
  const freq = frequency[selectedDeviceId];
  const versions = meta?.versions;

  switch (kind) {
    case "sensor":
      return (
        <SensorInspector
          id={selectedDeviceId}
          frequency={freq}
          versions={versions}
        />
      );
    case "source":
      return (
        <SourceInspector
          id={selectedDeviceId}
          frequency={freq}
          versions={versions}
        />
      );
    case "hub":
      return (
        <HubInspector
          id={selectedDeviceId}
          frequency={freq}
          versions={versions}
        />
      );
    default:
      return (
        <UnknownInspector
          id={selectedDeviceId}
          frequency={freq}
          versions={versions}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// Sensor Inspector
// ---------------------------------------------------------------------------

function SensorInspector({
  id,
  versions,
}: {
  id: number;
  frequency?: DeviceFrequency;
  versions?: DeviceVersions;
}) {
  const [data, setData] = useState<EmfImuFrameIdData | null>(null);

  useEffect(() => {
    const read = () => {
      const entry = useDeviceStore.getState().emfImuFrameId[id];
      if (entry) setData(entry);
    };
    read();
    const interval = setInterval(read, 100);
    return () => clearInterval(interval);
  }, [id]);

  const distortion = data ? data.metalDistortion / 255 : 0;

  if (!data) return <DetailSkeleton />;

  return (
    <div className="flex flex-col">
      <DetailHeader label={`Sensor ${id}`} imageSrc="/sensor.png" />
      <div className="px-3 py-3 space-y-4">
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

        <Section title="Gyroscope" unit="deg/s">
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
              value={`${data.temperature.toFixed(1)}\u00B0C`}
            />
            <DistortionCell distortion={distortion} />
            <ValueCell label="RSSI" value={String(data.rssi)} />
            <ValueCell label="Frame" value={String(data.frameId)} />
          </div>
        </Section>

        <Section title="Device">
          <div className="grid grid-cols-2 gap-1.5">
            <ValueCell label="Battery" value={data.sensorStatus.batteryLevel} />
            <ValueCell
              label="Charging"
              value={data.sensorStatus.batteryCharging ? "Yes" : "No"}
            />
            <ValueCell
              label="Source"
              value={
                data.sensorStatus.sourceConnected ? "Connected" : "Disconnected"
              }
            />
            <ValueCell label="B-Field" value={data.sensorStatus.bFieldStatus} />
            <ValueCell
              label="Sync"
              value={data.sensorStatus.sync ? "Yes" : "No"}
            />
            <ValueCell label="Coil" value={String(data.sourceCoilId)} />
            <ValueCell label="Calc ID" value={String(data.calcId)} />
            <ValueCell label="Source State" value={data.sensorState} />
          </div>
        </Section>

        {versions && <VersionsSection versions={versions} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Source Inspector
// ---------------------------------------------------------------------------

function SourceInspector({
  id,
  versions,
}: {
  id: number;
  frequency?: DeviceFrequency;
  versions?: DeviceVersions;
}) {
  const [measurement, setMeasurement] = useState<SourceMeasurementData | null>(
    null,
  );
  const [calibration, setCalibration] = useState<SourceCalibrationData | null>(
    null,
  );

  useEffect(() => {
    const read = () => {
      const state = useDeviceStore.getState();
      const m = state.sourceMeasurement[id];
      const c = state.sourceCalibration[id];
      if (m) setMeasurement(m);
      if (c) setCalibration(c);
    };
    read();
    const interval = setInterval(read, 100);
    return () => clearInterval(interval);
  }, [id]);

  return (
    <div className="flex flex-col">
      <DetailHeader label={`Source ${id}`} imageSrc="/source.png" />
      <div className="px-3 py-3 space-y-4">
        {measurement ? (
          <>
            <Section title="Current" unit="A">
              <div className="grid grid-cols-3 gap-1.5">
                <ValueCell label="X" value={measurement.current.x.toFixed(4)} />
                <ValueCell label="Y" value={measurement.current.y.toFixed(4)} />
                <ValueCell label="Z" value={measurement.current.z.toFixed(4)} />
              </div>
            </Section>

            <Section title="Accelerometer" unit="g">
              <div className="grid grid-cols-3 gap-1.5">
                <ValueCell label="X" value={measurement.imu.acc_x.toFixed(2)} />
                <ValueCell label="Y" value={measurement.imu.acc_y.toFixed(2)} />
                <ValueCell label="Z" value={measurement.imu.acc_z.toFixed(2)} />
              </div>
            </Section>

            <Section title="Gyroscope" unit="deg/s">
              <div className="grid grid-cols-3 gap-1.5">
                <ValueCell
                  label="X"
                  value={measurement.imu.gyro_x.toFixed(1)}
                />
                <ValueCell
                  label="Y"
                  value={measurement.imu.gyro_y.toFixed(1)}
                />
                <ValueCell
                  label="Z"
                  value={measurement.imu.gyro_z.toFixed(1)}
                />
              </div>
            </Section>

            <Section title="Magnetometer">
              <div className="grid grid-cols-3 gap-1.5">
                <ValueCell
                  label="X"
                  value={measurement.magneto.mag_x.toFixed(1)}
                />
                <ValueCell
                  label="Y"
                  value={measurement.magneto.mag_y.toFixed(1)}
                />
                <ValueCell
                  label="Z"
                  value={measurement.magneto.mag_z.toFixed(1)}
                />
              </div>
            </Section>

            <Section title="Voltage" unit="V">
              <div className="grid grid-cols-2 gap-1.5">
                {measurement.voltage.map((v, i) => (
                  <ValueCell key={i} label={`Ch ${i}`} value={v.toFixed(3)} />
                ))}
              </div>
            </Section>

            <Section title="Status">
              <div className="grid grid-cols-2 gap-1.5">
                <ValueCell
                  label="Temp"
                  value={`${measurement.temperature.toFixed(1)}\u00B0C`}
                />
                <ValueCell label="RSSI" value={String(measurement.rssi)} />
                <ValueCell label="Frame" value={String(measurement.frameId)} />
                <ValueCell
                  label="State"
                  value={String(measurement.sourceState)}
                />
                <ValueCell
                  label="Status"
                  value={String(measurement.sourceStatus)}
                />
              </div>
            </Section>
          </>
        ) : (
          <WaitingForData label="measurement" />
        )}

        {calibration ? (
          <Section title="Calibration">
            <div className="grid grid-cols-3 gap-1.5">
              <ValueCell
                label="Freq"
                value={`${calibration.frequency.toFixed(1)}Hz`}
              />
              <ValueCell
                label="Cal"
                value={calibration.calibration.toFixed(4)}
              />
              <ValueCell
                label="Phase"
                value={calibration.phaseModulationOffset.toFixed(4)}
              />
            </div>
          </Section>
        ) : (
          <WaitingForData label="calibration" />
        )}

        {versions && <VersionsSection versions={versions} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hub Inspector
// ---------------------------------------------------------------------------

function HubInspector({
  id,
  versions,
}: {
  id: number;
  frequency?: DeviceFrequency;
  versions?: DeviceVersions;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <DetailHeader label={`Hub ${id}`} imageSrc="/hub.png" />
      <div className="flex flex-1 flex-col items-center justify-start gap-3 px-4 py-8 text-center">
        <div className="size-10 rounded-full bg-zinc-500/10 flex items-center justify-center">
          <Router className="size-5 text-zinc-400" />
        </div>
        <div className="space-y-1.5 max-w-[200px]">
          <p className="text-xs font-medium text-sidebar-foreground/70">
            RF Hub
          </p>
          <p className="text-[11px] leading-relaxed text-sidebar-foreground/40">
            The hub receives messages via RF from nearby devices and
            forwards them over USB as a HID device.
          </p>
        </div>
      </div>
      {versions && (
        <div className="px-3 pb-3 mt-auto">
          <VersionsSection versions={versions} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unknown Inspector
// ---------------------------------------------------------------------------

function UnknownInspector({
  id,
  versions,
}: {
  id: number;
  frequency?: DeviceFrequency;
  versions?: DeviceVersions;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <DetailHeader label={`Unknown ${id}`} imageSrc="/amfitrack.svg" />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
        <div className="size-10 rounded-full bg-zinc-500/10 flex items-center justify-center">
          <CircleHelp className="size-5 text-zinc-400" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-sidebar-foreground/70">
            Unknown Device
          </p>
          <p className="text-[11px] text-sidebar-foreground/40">TX ID: {id}</p>
        </div>
      </div>
      {versions && (
        <div className="px-3 pb-3 mt-auto">
          <VersionsSection versions={versions} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function DetailHeader({
  label,
  imageSrc,
}: {
  label: string;
  imageSrc: string;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border/30 shrink-0">
      <span className="text-xs font-semibold text-sidebar-foreground">
        {label}
      </span>
      <Badge
        variant="link"
        className="relative h-9 w-9 shrink-0 overflow-hidden"
      >
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-contain object-center p-0.5 brightness-150"
          sizes="40px"
        />
      </Badge>
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
          className={cn("h-full rounded-full transition-[width]", barColor)}
          style={{ width: `${distortion * 100}%` }}
        />
      </div>
    </div>
  );
}

function VersionsSection({ versions }: { versions: DeviceVersions }) {
  return (
    <Section title="Versions">
      <div className="grid grid-cols-1 gap-1.5">
        <ValueCell label="Firmware" value={versions.firmware} />
        <ValueCell label="Hardware" value={versions.hardware} />
        <ValueCell label="RF" value={versions.RF} />
      </div>
    </Section>
  );
}

function WaitingForData({ label }: { label: string }) {
  return (
    <p className="text-[10px] text-sidebar-foreground/25 italic py-2">
      Waiting for {label} data…
    </p>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="text-center space-y-2">
        <div className="mx-auto size-12 rounded-full bg-sidebar/60 flex items-center justify-center">
          <Radio className="size-5 text-sidebar-foreground/20" />
        </div>
        <p className="text-[10.5px] text-sidebar-foreground/30">
          Select a device to inspect
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
      <div className="px-3 py-3 space-y-4">
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
