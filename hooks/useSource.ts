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

export interface SourceContextValue {
  sourceDevices: HIDDevice[];
  sourceConfigurations: Map<HIDDevice, Configuration[]>;
  sourceTxIds: Map<HIDDevice, number | null>;
  requestConnectionSource: () => Promise<void>;
  updateSourceParameterValue: (
    device: HIDDevice,
    uid: number,
    value: number | boolean | string,
  ) => void;
  refetchSourceConfiguration: (device: HIDDevice) => Promise<void>;
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
  const [sourceDevices, setSourceDevices] = useState<HIDDevice[]>([]);
  const [sourceConfigurations, setSourceConfigurations] = useState<
    Map<HIDDevice, Configuration[]>
  >(new Map());

  const sourceTxIds = useMemo(() => {
    const map = new Map<HIDDevice, number | null>();
    for (const [device, config] of sourceConfigurations) {
      map.set(
        device,
        config.length > 0 ? extractDeviceId(config) : null,
      );
    }
    return map;
  }, [sourceConfigurations]);

  useEffect(() => {
    const sdk = amfitrackWebRef.current;

    const unbind = sdk.on("sourceConnection", async (device, connected) => {
      if (connected) {
        let config: Configuration[] = [];
        try {
          config = (await sdk.getSourceConfiguration(device)) ?? [];
          console.log("source configuration", config);
        } catch (err) {
          console.error("Failed to get source config", err);
        }

        setSourceConfigurations((prev) => {
          const next = new Map(prev);
          next.set(device, config);
          return next;
        });
        setSourceDevices((prev) =>
          prev.includes(device) ? prev : [...prev, device],
        );
      } else {
        setSourceDevices((prev) => prev.filter((d) => d !== device));
        setSourceConfigurations((prev) => {
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

  const requestConnectionSource = useCallback(async () => {
    try {
      await amfitrackWebRef.current.requestConnectionSource();
    } catch (error) {
      if (error instanceof DeviceError) {
        toast.error(error.title, { description: error.description });
      } else {
        toast.error(error instanceof Error ? error.message : String(error));
      }
    }
  }, [amfitrackWebRef]);

  const updateSourceParameterValue = useCallback(
    (device: HIDDevice, uid: number, value: number | boolean | string) => {
      setSourceConfigurations((prev) => {
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

  const refetchSourceConfiguration = useCallback(
    async (device: HIDDevice) => {
      try {
        const config =
          await amfitrackWebRef.current.getSourceConfiguration(device);
        setSourceConfigurations((prev) => {
          const next = new Map(prev);
          next.set(device, config ?? []);
          return next;
        });
      } catch (err) {
        console.error("Failed to refetch source config", err);
      }
    },
    [amfitrackWebRef],
  );

  return {
    sourceDevices,
    sourceConfigurations,
    sourceTxIds,
    requestConnectionSource,
    updateSourceParameterValue,
    refetchSourceConfiguration,
  };
}
