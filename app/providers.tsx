"use client";

import { ReactNode } from "react";
import { AmfitrackContext, useAmfitrackProvider } from "@/hooks/useAmfitrack";
import { ConfigurationsContext, useConfigurationsProvider } from "@/hooks/useConfigurations";

export default function Providers({ children }: { children: ReactNode }) {
  const amfitrack = useAmfitrackProvider();
  const configurations = useConfigurationsProvider();

  return (
    <AmfitrackContext.Provider value={amfitrack}>
      <ConfigurationsContext.Provider value={configurations}>
        {children}
      </ConfigurationsContext.Provider>
    </AmfitrackContext.Provider>
  );
}
