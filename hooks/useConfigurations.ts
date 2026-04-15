import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface PendingConfiguration {
  deviceName: string;
  uid: number;
  categoryName: string;
  parameterName: string;
  currentValue: number | boolean | string;
  valueToPush: number | boolean | string;
}

interface ConfigurationsContextValue {
  configurations: PendingConfiguration[];
  updateConfiguration: (entry: PendingConfiguration) => void;
  removeConfiguration: (deviceName: string, uid: number) => void;
  clearConfigurations: () => void;
}

const ConfigurationsContext = createContext<ConfigurationsContextValue | null>(
  null,
);

export { ConfigurationsContext };

export function useConfigurations() {
  const ctx = useContext(ConfigurationsContext);
  if (!ctx) {
    throw new Error(
      "useConfigurations must be used within a ConfigurationsProvider",
    );
  }
  return ctx;
}

export function useConfigurationsProvider(): ConfigurationsContextValue {
  const [configurations, setConfigurations] = useState<PendingConfiguration[]>(
    [],
  );

  const updateConfiguration = useCallback((entry: PendingConfiguration) => {
    setConfigurations((prev) => {
      const idx = prev.findIndex(
        (c) => c.deviceName === entry.deviceName && c.uid === entry.uid,
      );

      if (entry.currentValue === entry.valueToPush) {
        if (idx >= 0) return prev.filter((_, i) => i !== idx);
        return prev;
      }

      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = entry;
        return updated;
      }
      return [...prev, entry];
    });
  }, []);

  const removeConfiguration = useCallback((deviceName: string, uid: number) => {
    setConfigurations((prev) =>
      prev.filter((c) => !(c.deviceName === deviceName && c.uid === uid)),
    );
  }, []);

  const clearConfigurations = useCallback(() => {
    setConfigurations([]);
  }, []);

  useEffect(() => {
    console.log("[Configurations] pending changes:", configurations);
  }, [configurations]);

  return {
    configurations,
    updateConfiguration,
    removeConfiguration,
    clearConfigurations,
  };
}
