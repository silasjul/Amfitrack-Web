"use client";

import { useAmfitrack } from "@/hooks/useAmfitrack";
import { useFrequency } from "@/hooks/useFrequency";
import DeviceCard from "./DeviceCard";

export default function Footer() {
  const {
    hubConnected,
    sourceConnected,
    hubConfiguration,
    sourceConfiguration,
    requestConnectionHub,
    requestConnectionSource,
  } = useAmfitrack();

  const { hub, source } = useFrequency();

  return (
    <div>
      <div className="flex flex-col gap-1.5 px-1 pb-1">
        <DeviceCard
          name="Hub"
          image="/hub.png"
          connected={hubConnected}
          configuration={hubConfiguration}
          frequency={hub}
          onConnect={requestConnectionHub}
        />
        <DeviceCard
          name="Source"
          image="/source.png"
          connected={sourceConnected}
          configuration={sourceConfiguration}
          frequency={source}
          onConnect={requestConnectionSource}
        />
      </div>
    </div>
  );
}
