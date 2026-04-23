"use client";

import { ReactNode, useEffect } from "react";
import { AmfitrackContext, useAmfitrackProvider } from "@/amfitrackSDK";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePendingConfigStore } from "@/stores/usePendingConfigStore";

export default function Providers({ children }: { children: ReactNode }) {
  const sdk = useAmfitrackProvider();

  useEffect(() => {
    usePendingConfigStore.getState().fetchTooltips();
  }, []);

  return (
    <AmfitrackContext.Provider value={sdk}>
      <TooltipProvider>{children}</TooltipProvider>
    </AmfitrackContext.Provider>
  );
}
