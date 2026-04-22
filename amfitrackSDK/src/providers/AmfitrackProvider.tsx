"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { AmfitrackSDK } from "../../AmfitrackSDK";

interface IAmfitrackProvider {
  sdk: AmfitrackSDK | null;
  isLoading: boolean;
}

const AmfitrackContext = createContext<IAmfitrackProvider | null>(null);

export { AmfitrackContext };

export function useAmfitrack() {
  const ctx = useContext(AmfitrackContext);
  if (!ctx) {
    throw new Error("useAmfitrack must be used within an AmfitrackProvider");
  }
  return ctx;
}

export function useAmfitrackProvider(): IAmfitrackProvider {
  const [sdk, setSdk] = useState<AmfitrackSDK | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sdk = new AmfitrackSDK();
    sdk.initialize();
    setSdk(sdk);
    setIsLoading(false);

    return () => {
      sdk.destroy();
    };
  }, []);

  return {
    sdk,
    isLoading,
  };
}
