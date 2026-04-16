"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { AmfitrackWeb } from "@/amfitrackWebSDK";
import { type DeviceFrequency } from "@/amfitrackWebSDK/AmfitrackWeb";

interface AmfitrackContextValue {
  isReading: boolean;
  messageFrequencyRef: React.RefObject<Map<number, DeviceFrequency>>;
  amfitrackWebRef: React.RefObject<AmfitrackWeb>;
}

const AmfitrackContext = createContext<AmfitrackContextValue | null>(null);

export { AmfitrackContext };

export function useAmfitrack() {
  const ctx = useContext(AmfitrackContext);
  if (!ctx) {
    throw new Error("useAmfitrack must be used within an AmfitrackProvider");
  }
  return ctx;
}

export function useAmfitrackProvider(): AmfitrackContextValue {
  const amfitrackWebRef = useRef(new AmfitrackWeb());
  const [isReading, setIsReading] = useState(false);
  const messageFrequencyRef = useRef<Map<number, DeviceFrequency>>(new Map());

  useEffect(() => {
    const sdk = amfitrackWebRef.current;

    const unbindReading = sdk.on("reading", setIsReading);

    const unbindFrequency = sdk.on("messageFrequency", (data) => {
      messageFrequencyRef.current = data;
    });

    const unbindError = sdk.on("error", ({ title, description }) => {
      toast.error(title, { description });
    });

    sdk.initialize();

    return () => {
      unbindReading();
      unbindFrequency();
      unbindError();
      sdk.destroy();
    };
  }, []);

  return {
    isReading,
    messageFrequencyRef,
    amfitrackWebRef,
  };
}
