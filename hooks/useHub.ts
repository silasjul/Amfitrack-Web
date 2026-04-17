"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { AmfitrackWeb } from "@/amfitrackWebSDK";
import { Hub } from "@/amfitrackWebSDK";
import { Configuration, extractDeviceId } from "@/amfitrackWebSDK/Configurator";

export interface HubContextValue {
  hubs: Hub[];
  hubConfigurations: Map<Hub, Configuration[]>;
  updateHubParameterValue: (
    hub: Hub,
    uid: number,
    value: number | boolean | string,
  ) => void;
  refetchHubConfiguration: (hub: Hub) => Promise<void>;
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
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [hubConfigurations, setHubConfigurations] = useState<
    Map<Hub, Configuration[]>
  >(new Map());

  useEffect(() => {
    const sdk = amfitrackWebRef.current;

    const fetchConfig = async (hub: Hub) => {
      if (!hub.hidDevice) return;
      try {
        const config = (await sdk.getHubConfiguration(hub.hidDevice)) ?? [];
        console.log("hub configuration", config);
        const txId = extractDeviceId(config);
        if (txId !== null) sdk.setDeviceTxId(hub, txId);
        setHubConfigurations((prev) => {
          const next = new Map(prev);
          next.set(hub, config);
          return next;
        });
        setHubs((prev) => [...prev]);
      } catch (err) {
        console.error("Failed to get hub config", err);
      }
    };

    const unbindAdded = sdk.on("deviceAdded", (device) => {
      if (device.kind !== "hub") return;
      const hub = device as Hub;
      setHubs((prev) => (prev.includes(hub) ? prev : [...prev, hub]));
      fetchConfig(hub);
    });

    const unbindUpdated = sdk.on("deviceUpdated", (device) => {
      if (device.kind !== "hub") return;
      setHubs((prev) => (prev.includes(device as Hub) ? [...prev] : prev));
    });

    const unbindRemoved = sdk.on("deviceRemoved", (device) => {
      if (device.kind !== "hub") return;
      const hub = device as Hub;
      setHubs((prev) => prev.filter((h) => h !== hub));
      setHubConfigurations((prev) => {
        if (!prev.has(hub)) return prev;
        const next = new Map(prev);
        next.delete(hub);
        return next;
      });
    });

    return () => {
      unbindAdded();
      unbindUpdated();
      unbindRemoved();
    };
  }, [amfitrackWebRef]);

  const updateHubParameterValue = useCallback(
    (hub: Hub, uid: number, value: number | boolean | string) => {
      setHubConfigurations((prev) => {
        const next = new Map(prev);
        const existing = next.get(hub);
        if (existing) {
          next.set(
            hub,
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
    async (hub: Hub) => {
      if (!hub.hidDevice) return;
      const sdk = amfitrackWebRef.current;
      try {
        const config = (await sdk.getHubConfiguration(hub.hidDevice)) ?? [];
        console.log("hub configuration", config);
        const txId = extractDeviceId(config);
        if (txId !== null) sdk.setDeviceTxId(hub, txId);
        setHubConfigurations((prev) => {
          const next = new Map(prev);
          next.set(hub, config);
          return next;
        });
        setHubs((prev) => [...prev]);
      } catch (err) {
        console.error("Failed to refetch hub config", err);
      }
    },
    [amfitrackWebRef],
  );

  return {
    hubs,
    hubConfigurations,
    updateHubParameterValue,
    refetchHubConfiguration,
  };
}
