"use client";

import { ReactNode } from "react";
import { AmfitrackContext, useAmfitrackProvider } from "@/hooks/useAmfitrack";

export default function Providers({ children }: { children: ReactNode }) {
  const amfitrack = useAmfitrackProvider();

  return (
    <AmfitrackContext.Provider value={amfitrack}>
      {children}
    </AmfitrackContext.Provider>
  );
}
