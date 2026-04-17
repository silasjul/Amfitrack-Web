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
  const { hubs } = useHub();
  const { sources } = useSource();
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
        setSnapshot({
          sensors: new Map(),
          hubs: new Map(),
          sources: new Map(),
        });
        return;
      }

      const hubTxIdSet = new Set<number>();
      for (const hub of hubs) {
        if (hub.txId !== null) hubTxIdSet.add(hub.txId);
      }

      const sourceTxIdSet = new Set<number>();
      for (const source of sources) {
        if (source.txId !== null) sourceTxIdSet.add(source.txId);
      }

      const sensorIdSet = new Set(sensorIds);
      const sensorFreq = new Map<number, DeviceFrequency>();
      const hubFreq = new Map<number, DeviceFrequency>();
      const sourceFreq = new Map<number, DeviceFrequency>();

      for (const [txId, freq] of freqMap) {
        if (hubTxIdSet.has(txId)) {
          hubFreq.set(txId, freq);
        } else if (sourceTxIdSet.has(txId)) {
          sourceFreq.set(txId, freq);
        } else if (sensorIdSet.has(txId)) {
          sensorFreq.set(txId, freq);
        }
      }

      setSnapshot({
        sensors: sensorFreq,
        hubs: hubFreq,
        sources: sourceFreq,
      });
    }, 200);

    return () => clearInterval(interval);
  }, [sensorIds, hubs, sources, messageFrequencyRef]);

  return snapshot;
}
