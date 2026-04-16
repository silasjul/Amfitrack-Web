"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import type { AmfitrackWeb } from "@/amfitrackWebSDK";
import { DeviceError } from "@/amfitrackWebSDK/AmfitrackWeb";
import { Configuration, extractDeviceId } from "@/amfitrackWebSDK/Configurator";

export interface HubContextValue {
  hubDevices: HIDDevice[];
  hubConfigurations: Map<HIDDevice, Configuration[]>;
  hubTxIds: Map<HIDDevice, number | null>;
  requestConnectionHub: () => Promise<void>;
  updateHubParameterValue: (
    device: HIDDevice,
    uid: number,
    value: number | boolean | string,
  ) => void;
  refetchHubConfiguration: (device: HIDDevice) => Promise<void>;
}

const HubContext = createContext<HubContextValue | null>(null);

export { HubContext };

export function useHub() {
  const ctx = useContext(HubContext);
  if (!ctx) {
    throw new Error("useHub must be used within a HubProvider");
  }
  return ctx;
}

export function useHubProvider(
  amfitrackWebRef: React.RefObject<AmfitrackWeb>,
): HubContextValue {
  const [hubDevices, setHubDevices] = useState<HIDDevice[]>([]);
  const [hubConfigurations, setHubConfigurations] = useState<
    Map<HIDDevice, Configuration[]>
  >(new Map());

  const hubTxIds = useMemo(() => {
    const map = new Map<HIDDevice, number | null>();
    for (const [device, config] of hubConfigurations) {
      map.set(device, config.length > 0 ? extractDeviceId(config) : null);
    }
    return map;
  }, [hubConfigurations]);

  useEffect(() => {
    const sdk = amfitrackWebRef.current;

    const unbind = sdk.on("hubConnection", async (device, connected) => {
      if (connected) {
        let config: Configuration[] = [];
        try {
          config = (await sdk.getHubConfiguration(device)) ?? [];
          console.log("hub configuration", config);
        } catch (err) {
          console.error("Failed to get hub config", err);
        }

        setHubConfigurations((prev) => {
          const next = new Map(prev);
          next.set(device, config);
          return next;
        });
        setHubDevices((prev) =>
          prev.includes(device) ? prev : [...prev, device],
        );
      } else {
        setHubDevices((prev) => prev.filter((d) => d !== device));
        setHubConfigurations((prev) => {
          const next = new Map(prev);
          next.delete(device);
          return next;
        });
      }
    });

    return () => {
      unbind();
    };
  }, [amfitrackWebRef]);

  const requestConnectionHub = useCallback(async () => {
    try {
      await amfitrackWebRef.current.requestConnectionHub();
    } catch (error) {
      if (error instanceof DeviceError) {
        toast.error(error.title, { description: error.description });
      } else {
        toast.error(error instanceof Error ? error.message : String(error));
      }
    }
  }, [amfitrackWebRef]);

  const updateHubParameterValue = useCallback(
    (device: HIDDevice, uid: number, value: number | boolean | string) => {
      setHubConfigurations((prev) => {
        const next = new Map(prev);
        const existing = next.get(device);
        if (existing) {
          next.set(
            device,
            existing.map((cat) => ({
              ...cat,
              parameters: cat.parameters.map((p) =>
                p.uid === uid ? { ...p, value } : p,
              ),
            })),
          );
        }
        return next;
      });
    },
    [],
  );

  const refetchHubConfiguration = useCallback(
    async (device: HIDDevice) => {
      try {
        const config =
          await amfitrackWebRef.current.getHubConfiguration(device);
        setHubConfigurations((prev) => {
          const next = new Map(prev);
          next.set(device, config ?? []);
          return next;
        });
      } catch (err) {
        console.error("Failed to refetch hub config", err);
      }
    },
    [amfitrackWebRef],
  );

  return {
    hubDevices,
    hubConfigurations,
    hubTxIds,
    requestConnectionHub,
    updateHubParameterValue,
    refetchHubConfiguration,
  };
}
