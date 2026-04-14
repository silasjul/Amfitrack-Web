"use client";

import { useEffect, useState } from "react";
import { useAmfitrack } from "@/hooks/useAmfitrack";
import { type DeviceFrequency } from "@/amfitrackWebSDK/AmfitrackWeb";

export interface FrequencySnapshot {
  sensors: Map<number, DeviceFrequency>;
  hub: DeviceFrequency | null;
  source: DeviceFrequency | null;
}

export function useFrequency(): FrequencySnapshot {
  const { sensorIds, hubTxId, sourceTxId, messageFrequencyRef } =
    useAmfitrack();
  const [snapshot, setSnapshot] = useState<FrequencySnapshot>({
    sensors: new Map(),
    hub: null,
    source: null,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const freqMap = messageFrequencyRef.current;
      if (freqMap.size === 0) {
        setSnapshot({ sensors: new Map(), hub: null, source: null });
        return;
      }

      const sensorIdSet = new Set(sensorIds);
      const sensors = new Map<number, DeviceFrequency>();
      let hub: DeviceFrequency | null = null;
      let source: DeviceFrequency | null = null;

      for (const [txId, freq] of freqMap) {
        if (txId === hubTxId) {
          hub = freq;
        } else if (txId === sourceTxId) {
          source = freq;
        } else if (sensorIdSet.has(txId)) {
          sensors.set(txId, freq);
        }
      }

      setSnapshot({ sensors, hub, source });
    }, 200);

    return () => clearInterval(interval);
  }, [sensorIds, hubTxId, sourceTxId, messageFrequencyRef]);

  return snapshot;
}
