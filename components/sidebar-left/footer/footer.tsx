"use client";


import { useAmfitrack } from "@/hooks/useAmfitrack";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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

  return (
    <div>
      <div className="flex flex-col gap-1.5 px-1 pb-1">
        <DeviceCard
          name="Hub"
          image="/hub.png"
          connected={hubConnected}
          configuration={hubConfiguration}
          onConnect={requestConnectionHub}
        />
        <DeviceCard
          name="Source"
          image="/source.png"
          connected={sourceConnected}
          configuration={sourceConfiguration}
          onConnect={requestConnectionSource}
        />
      </div>
    </div>
  );
}
