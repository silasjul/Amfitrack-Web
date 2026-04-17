"use client";

import { ReactNode } from "react";
import { AmfitrackContext, useAmfitrackProvider } from "@/hooks/useAmfitrack";
import { HubContext, useHubProvider } from "@/hooks/useHub";
import { SourceContext, useSourceProvider } from "@/hooks/useSource";
import { SensorContext, useSensorProvider } from "@/hooks/useSensor";
import {
  ConfigurationsContext,
  useConfigurationsProvider,
} from "@/hooks/useConfigurations";

export default function Providers({ children }: { children: ReactNode }) {
  const amfitrack = useAmfitrackProvider();
  const hub = useHubProvider(amfitrack.amfitrackWebRef);
  const source = useSourceProvider(amfitrack.amfitrackWebRef);
  const sensor = useSensorProvider(
    amfitrack.amfitrackWebRef,
    hub.hubs.length > 0,
  );
  const configurations = useConfigurationsProvider();

  return (
    <AmfitrackContext.Provider value={amfitrack}>
      <HubContext.Provider value={hub}>
        <SourceContext.Provider value={source}>
          <SensorContext.Provider value={sensor}>
            <ConfigurationsContext.Provider value={configurations}>
              {children}
            </ConfigurationsContext.Provider>
          </SensorContext.Provider>
        </SourceContext.Provider>
      </HubContext.Provider>
    </AmfitrackContext.Provider>
  );
}
