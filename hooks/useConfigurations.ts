import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import { parseConfigToObject, ParsedConfig } from "@/lib/configTooltipParser";

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
  configurationTooltips: ParsedConfig;
  updateConfiguration: (entry: PendingConfiguration) => void;
  removeConfiguration: (deviceName: string, uid: number) => void;
  removeConfigurationsForDevice: (deviceName: string) => void;
  renameDevice: (oldName: string, newName: string) => void;
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
  const [configurationTooltips, setConfigurationTooltips] =
    useState<ParsedConfig>({});
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

  const removeConfigurationsForDevice = useCallback((deviceName: string) => {
    setConfigurations((prev) =>
      prev.filter((c) => c.deviceName !== deviceName),
    );
  }, []);

  const renameDevice = useCallback((oldName: string, newName: string) => {
    setConfigurations((prev) =>
      prev.map((c) =>
        c.deviceName === oldName ? { ...c, deviceName: newName } : c,
      ),
    );
  }, []);

  const clearConfigurations = useCallback(() => {
    setConfigurations([]);
  }, []);

  useEffect(() => {
    // console.log("[Configurations] pending changes:", configurations);
  }, [configurations]);

  /**
   * Fetch configuration tooltips once
   */
  useEffect(() => {
    const fetchConfigurationTooltips = async () => {
      try {
        const tooltips = await axios.get("/api/configuration-tooltips");
        const parsedTooltips = parseConfigToObject(tooltips.data, {
          includeRstOnlyBlocks: true,
        });
        // console.log("[Configurations] parsed tooltips:", parsedTooltips);
        setConfigurationTooltips(parsedTooltips);
      } catch (err) {
        console.error(
          "[Configurations] Failed to load configuration tooltips:",
          err,
        );
      }
    };
    fetchConfigurationTooltips();
  }, []);

  return {
    configurations,
    configurationTooltips,
    updateConfiguration,
    removeConfiguration,
    removeConfigurationsForDevice,
    renameDevice,
    clearConfigurations,
  };
}
