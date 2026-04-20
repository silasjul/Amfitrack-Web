"use client";

import { ReactNode } from "react";
import {
  AmfitrackContext as OldAmfitrackContext,
  useAmfitrackProvider as OldUseAmfitrackProvider,
} from "@/hooks/useAmfitrack";
import { HubContext, useHubProvider } from "@/hooks/useHub";
import { SourceContext, useSourceProvider } from "@/hooks/useSource";
import { SensorContext, useSensorProvider } from "@/hooks/useSensor";
import {
  ConfigurationsContext,
  useConfigurationsProvider,
} from "@/hooks/useConfigurations";
import { AmfitrackContext, useAmfitrackProvider } from "@/amfitrackSDK";

export default function Providers({ children }: { children: ReactNode }) {
  const sdk = useAmfitrackProvider();
  const oldamfitrack = OldUseAmfitrackProvider();
  const hub = useHubProvider(oldamfitrack.amfitrackWebRef);
  const source = useSourceProvider(oldamfitrack.amfitrackWebRef);
  const sensor = useSensorProvider(
    oldamfitrack.amfitrackWebRef,
    hub.hubs.length > 0,
  );
  const configurations = useConfigurationsProvider();

  return (
    <AmfitrackContext.Provider value={sdk}>
      <OldAmfitrackContext.Provider value={oldamfitrack}>
        <HubContext.Provider value={hub}>
          <SourceContext.Provider value={source}>
            <SensorContext.Provider value={sensor}>
              <ConfigurationsContext.Provider value={configurations}>
                {children}
              </ConfigurationsContext.Provider>
            </SensorContext.Provider>
          </SourceContext.Provider>
        </HubContext.Provider>
      </OldAmfitrackContext.Provider>
    </AmfitrackContext.Provider>
  );
}
