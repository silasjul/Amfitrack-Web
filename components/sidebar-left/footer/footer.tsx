"use client";

import { useHub } from "@/hooks/useHub";
import { useSource } from "@/hooks/useSource";
import DeviceCard from "./DeviceCard";

export default function Footer() {
  const { hubDevices, requestConnectionHub } = useHub();
  const { sourceDevices, requestConnectionSource } = useSource();

  return (
    <div>
      <div className="flex flex-col gap-1.5 px-1 pb-1">
        <DeviceCard
          name="Hub"
          image="/hub.png"
          connectedCount={hubDevices.length}
          onConnect={requestConnectionHub}
        />
        <DeviceCard
          name="Source"
          image="/source.png"
          connectedCount={sourceDevices.length}
          onConnect={requestConnectionSource}
        />
      </div>
    </div>
  );
}
