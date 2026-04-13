"use client";

import { useEffect, useState } from "react";
import { useAmfitrack } from "@/hooks/useAmfitrack";
import { type DeviceFrequency } from "@/amfitrackWebSDK/AmfitrackWeb";
import { PayloadType } from "@/amfitrackWebSDK/packets/PacketDecoder";

const SOURCE_PAYLOAD_TYPES = new Set([
  PayloadType.SOURCE_MEASUREMENT,
  PayloadType.SOURCE_CALIBRATION,
]);

export interface FrequencySnapshot {
  sensors: Map<number, DeviceFrequency>;
  hub: DeviceFrequency | null;
  source: DeviceFrequency | null;
}

export function useFrequency(): FrequencySnapshot {
  const { sensorIds, messageFrequencyRef } = useAmfitrack();
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
      const hubByType: Partial<Record<PayloadType, number>> = {};
      const sourceByType: Partial<Record<PayloadType, number>> = {};
      let hubTotal = 0;
      let sourceTotal = 0;

      for (const [txId, freq] of freqMap) {
        if (sensorIdSet.has(txId)) {
          sensors.set(txId, freq);
          continue;
        }

        for (const [typeKey, hz] of Object.entries(freq.byPayloadType)) {
          const pType = Number(typeKey) as PayloadType;
          const val = hz ?? 0;
          if (SOURCE_PAYLOAD_TYPES.has(pType)) {
            sourceByType[pType] = (sourceByType[pType] ?? 0) + val;
            sourceTotal += val;
          } else {
            hubByType[pType] = (hubByType[pType] ?? 0) + val;
            hubTotal += val;
          }
        }
      }

      setSnapshot({
        sensors,
        hub: hubTotal > 0 ? { totalHz: hubTotal, byPayloadType: hubByType } : null,
        source: sourceTotal > 0 ? { totalHz: sourceTotal, byPayloadType: sourceByType } : null,
      });
    }, 200);

    return () => clearInterval(interval);
  }, [sensorIds, messageFrequencyRef]);

  return snapshot;
}
