"use client";

import { useEffect, useState } from "react";
import { useAmfitrack } from "@/hooks/useAmfitrack";
import { useHub } from "@/hooks/useHub";
import { useSource } from "@/hooks/useSource";
import { useSensor } from "@/hooks/useSensor";
import { type DeviceFrequency } from "@/amfitrackWebSDK/AmfitrackWeb";

export interface FrequencySnapshot {
  sensors: Map<number, DeviceFrequency>;
  hubs: Map<number, DeviceFrequency>;
  sources: Map<number, DeviceFrequency>;
}

export function useFrequency(): FrequencySnapshot {
  const { messageFrequencyRef } = useAmfitrack();
  const { hubTxIds } = useHub();
  const { sourceTxIds } = useSource();
  const { sensorIds } = useSensor();
  const [snapshot, setSnapshot] = useState<FrequencySnapshot>({
    sensors: new Map(),
    hubs: new Map(),
    sources: new Map(),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const freqMap = messageFrequencyRef.current;
      if (freqMap.size === 0) {
        setSnapshot({ sensors: new Map(), hubs: new Map(), sources: new Map() });
        return;
      }

      const hubTxIdSet = new Set<number>();
      for (const txId of hubTxIds.values()) {
        if (txId !== null) hubTxIdSet.add(txId);
      }

      const sourceTxIdSet = new Set<number>();
      for (const txId of sourceTxIds.values()) {
        if (txId !== null) sourceTxIdSet.add(txId);
      }

      const sensorIdSet = new Set(sensorIds);
      const sensors = new Map<number, DeviceFrequency>();
      const hubs = new Map<number, DeviceFrequency>();
      const sources = new Map<number, DeviceFrequency>();

      for (const [txId, freq] of freqMap) {
        if (hubTxIdSet.has(txId)) {
          hubs.set(txId, freq);
        } else if (sourceTxIdSet.has(txId)) {
          sources.set(txId, freq);
        } else if (sensorIdSet.has(txId)) {
          sensors.set(txId, freq);
        }
      }

      setSnapshot({ sensors, hubs, sources });
    }, 200);

    return () => clearInterval(interval);
  }, [sensorIds, hubTxIds, sourceTxIds, messageFrequencyRef]);

  return snapshot;
}
