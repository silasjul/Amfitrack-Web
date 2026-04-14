"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { AmfitrackWeb } from "@/amfitrackWebSDK";
import {
  type DeviceFrequency,
  DeviceError,
} from "@/amfitrackWebSDK/AmfitrackWeb";
import { Configuration, extractDeviceId } from "@/amfitrackWebSDK/Configurator";

interface AmfitrackContextValue {
  isReading: boolean;
  hubConnected: boolean;
  sourceConnected: boolean;
  hubTxId: number | null;
  sourceTxId: number | null;
  messageFrequencyRef: React.RefObject<Map<number, DeviceFrequency>>;
  amfitrackWebRef: React.RefObject<AmfitrackWeb>;
  hubConfiguration: Configuration[];
  sourceConfiguration: Configuration[];
  requestConnectionHub: () => Promise<void>;
  requestConnectionSource: () => Promise<void>;
  updateParameterValue: (
    deviceName: string,
    uid: number,
    value: number | boolean | string,
  ) => void;
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
  const [hubConnected, setHubConnected] = useState(false);
  const [sourceConnected, setSourceConnected] = useState(false);
  const [hubConfiguration, setHubConfiguration] = useState<Configuration[]>([]);
  const [sourceConfiguration, setSourceConfiguration] = useState<
    Configuration[]
  >([]);

  const hubTxId =
    hubConfiguration.length > 0 ? extractDeviceId(hubConfiguration) : null;
  const sourceTxId =
    sourceConfiguration.length > 0
      ? extractDeviceId(sourceConfiguration)
      : null;

  const messageFrequencyRef = useRef<Map<number, DeviceFrequency>>(new Map());

  useEffect(() => {
    const sdk = amfitrackWebRef.current;

    const unbindHub = sdk.on("hubConnection", (connected) => {
      setHubConnected(connected);

      if (connected) {
        sdk.getHubConfiguration().then((config) => {
          console.log("hub configuration", config);
          setHubConfiguration(config ?? []);
        });
      } else {
        setHubConfiguration([]);
      }
    });

    const unbindSource = sdk.on("sourceConnection", (connected) => {
      setSourceConnected(connected);

      if (connected) {
        sdk.getSourceConfiguration().then((config) => {
          console.log("source configuration", config);
          setSourceConfiguration(config ?? []);
        });
      } else {
        setSourceConfiguration([]);
      }
    });
    const unbindReading = sdk.on("reading", setIsReading);

    const unbindFrequency = sdk.on("messageFrequency", (data) => {
      messageFrequencyRef.current = data;
    });

    const unbindError = sdk.on("error", ({ title, description }) => {
      toast.error(title, { description });
    });

    sdk.initialize();

    return () => {
      unbindHub();
      unbindSource();
      unbindReading();
      unbindFrequency();
      unbindError();
      sdk.destroy();
    };
  }, []);

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
  }, []);

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
  }, []);

  const updateParameterValue = useCallback(
    (deviceName: string, uid: number, value: number | boolean | string) => {
      const patchConfig = (configs: Configuration[]) =>
        configs.map((cat) => ({
          ...cat,
          parameters: cat.parameters.map((p) =>
            p.uid === uid ? { ...p, value } : p,
          ),
        }));

      if (deviceName === "Hub") {
        setHubConfiguration((prev) => patchConfig(prev));
      } else if (deviceName === "Source") {
        setSourceConfiguration((prev) => patchConfig(prev));
      }
    },
    [],
  );

  return {
    isReading,
    hubConnected,
    sourceConnected,
    hubTxId,
    sourceTxId,
    messageFrequencyRef,
    amfitrackWebRef,
    hubConfiguration,
    sourceConfiguration,
    requestConnectionHub,
    requestConnectionSource,
    updateParameterValue,
  };
}
