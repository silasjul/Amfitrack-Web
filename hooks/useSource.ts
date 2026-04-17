"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { AmfitrackWeb } from "@/amfitrackWebSDK";
import { Source } from "@/amfitrackWebSDK";
import { Configuration, extractDeviceId } from "@/amfitrackWebSDK/Configurator";

export interface SourceContextValue {
  sources: Source[];
  sourceConfigurations: Map<Source, Configuration[]>;
  updateSourceParameterValue: (
    source: Source,
    uid: number,
    value: number | boolean | string,
  ) => void;
  refetchSourceConfiguration: (source: Source) => Promise<void>;
}

const SourceContext = createContext<SourceContextValue | null>(null);

export { SourceContext };

export function useSource() {
  const ctx = useContext(SourceContext);
  if (!ctx) {
    throw new Error("useSource must be used within a SourceProvider");
  }
  return ctx;
}

export function useSourceProvider(
  amfitrackWebRef: React.RefObject<AmfitrackWeb>,
): SourceContextValue {
  const [sources, setSources] = useState<Source[]>([]);
  const [sourceConfigurations, setSourceConfigurations] = useState<
    Map<Source, Configuration[]>
  >(new Map());

  useEffect(() => {
    const sdk = amfitrackWebRef.current;

    // Track which sources we have already fetched/are fetching, so that
    // `deviceUpdated` events (e.g. when a hub-forwarded source finally has
    // a txId) do not retrigger a fetch once we already have the config.
    const fetched = new WeakSet<Source>();

    const fetchConfig = async (source: Source) => {
      if (fetched.has(source)) return;
      // USB needs an hidDevice; hub-forwarded path needs a known txId.
      if (!source.hidDevice && source.txId === null) return;
      fetched.add(source);
      try {
        const config = (await sdk.getSourceConfiguration(source)) ?? [];
        console.log("source configuration", config);
        const txId = extractDeviceId(config);
        if (txId !== null) sdk.setDeviceTxId(source, txId);
        setSourceConfigurations((prev) => {
          const next = new Map(prev);
          next.set(source, config);
          return next;
        });
        setSources((prev) => [...prev]);
      } catch (err) {
        fetched.delete(source);
        console.error("Failed to get source config", err);
      }
    };

    const unbindAdded = sdk.on("deviceAdded", (device) => {
      if (device.kind !== "source") return;
      const source = device as Source;
      setSources((prev) =>
        prev.includes(source) ? prev : [...prev, source],
      );
      fetchConfig(source);
    });

    const unbindUpdated = sdk.on("deviceUpdated", (device) => {
      if (device.kind !== "source") return;
      const source = device as Source;
      setSources((prev) => (prev.includes(source) ? [...prev] : prev));
      // A txId may have landed after the device was first seen; retry.
      fetchConfig(source);
    });

    const unbindRemoved = sdk.on("deviceRemoved", (device) => {
      if (device.kind !== "source") return;
      const source = device as Source;
      setSources((prev) => prev.filter((s) => s !== source));
      setSourceConfigurations((prev) => {
        if (!prev.has(source)) return prev;
        const next = new Map(prev);
        next.delete(source);
        return next;
      });
    });

    return () => {
      unbindAdded();
      unbindUpdated();
      unbindRemoved();
    };
  }, [amfitrackWebRef]);

  const updateSourceParameterValue = useCallback(
    (source: Source, uid: number, value: number | boolean | string) => {
      setSourceConfigurations((prev) => {
        const next = new Map(prev);
        const existing = next.get(source);
        if (existing) {
          next.set(
            source,
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

  const refetchSourceConfiguration = useCallback(
    async (source: Source) => {
      const sdk = amfitrackWebRef.current;
      if (!source.hidDevice && source.txId === null) return;
      try {
        const config = (await sdk.getSourceConfiguration(source)) ?? [];
        console.log("source configuration", config);
        const txId = extractDeviceId(config);
        if (txId !== null) sdk.setDeviceTxId(source, txId);
        setSourceConfigurations((prev) => {
          const next = new Map(prev);
          next.set(source, config);
          return next;
        });
        setSources((prev) => [...prev]);
      } catch (err) {
        console.error("Failed to refetch source config", err);
      }
    },
    [amfitrackWebRef],
  );

  return {
    sources,
    sourceConfigurations,
    updateSourceParameterValue,
    refetchSourceConfiguration,
  };
}
