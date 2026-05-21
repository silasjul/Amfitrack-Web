"use client";

import { ReactNode, useEffect } from "react";
import { AmfitrackContext, useAmfitrackProvider } from "@/amfitrackSDK";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePendingConfigStore } from "@/stores/usePendingConfigStore";
import { useAmfitrackWebRTCAutoConnect } from "@/hooks/xr/useAmfitrackWebRTCAutoConnect";

export default function Providers({ children }: { children: ReactNode }) {
  const sdk = useAmfitrackProvider();

  useEffect(() => {
    usePendingConfigStore.getState().fetchTooltips();
  }, []);

  return (
    <AmfitrackContext.Provider value={sdk}>
      <WebRTCAutoConnect />
      <TooltipProvider>{children}</TooltipProvider>
    </AmfitrackContext.Provider>
  );
}

function WebRTCAutoConnect() {
  useAmfitrackWebRTCAutoConnect();
  return null;
}
