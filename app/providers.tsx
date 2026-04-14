"use client";

import { ReactNode } from "react";
import { AmfitrackContext, useAmfitrackProvider } from "@/hooks/useAmfitrack";
import { SensorContext, useSensorProvider } from "@/hooks/useSensor";
import { ConfigurationsContext, useConfigurationsProvider } from "@/hooks/useConfigurations";

export default function Providers({ children }: { children: ReactNode }) {
  const amfitrack = useAmfitrackProvider();
  const sensor = useSensorProvider(amfitrack.amfitrackWebRef, amfitrack.hubConnected);
  const configurations = useConfigurationsProvider();

  return (
    <AmfitrackContext.Provider value={amfitrack}>
      <SensorContext.Provider value={sensor}>
        <ConfigurationsContext.Provider value={configurations}>
          {children}
        </ConfigurationsContext.Provider>
      </SensorContext.Provider>
    </AmfitrackContext.Provider>
  );
}
