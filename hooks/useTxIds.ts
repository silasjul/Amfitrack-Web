import { useDeviceStore } from "@/amfitrackSDK/src/store/useDeviceStore";
import { useMemo } from "react";

export interface UseTxIdsResult {
  sensorTxIds: number[];
  sourceTxIds: number[];
  hubTxIds: number[];
  unknownTxIds: number[];
  BLETxIds: number[];
  USBTxIds: number[];
}

export default function useTxIds(): UseTxIdsResult {
  const deviceMeta = useDeviceStore((s) => s.deviceMeta);

  return useMemo(() => {
    const sensorTxIds: number[] = [];
    const sourceTxIds: number[] = [];
    const hubTxIds: number[] = [];
    const unknownTxIds: number[] = [];
    const BLETxIds: number[] = [];
    const USBTxIds: number[] = [];

    for (const key of Object.keys(deviceMeta)) {
      const id = Number(key);
      if (!Number.isFinite(id)) continue;

      const meta = deviceMeta[id];
      if (!meta) continue;

      // Transport lists include all entries (temp negative IDs too).
      if (meta.uplink === "ble") BLETxIds.push(id);
      else if (meta.uplink === "usb") USBTxIds.push(id);

      // // Device lists only include resolved IDs.
      // if (id < 0) continue;

      if (meta.kind === "sensor") sensorTxIds.push(id);
      else if (meta.kind === "source") sourceTxIds.push(id);
      else if (meta.kind === "hub") hubTxIds.push(id);
      else if (meta.kind === "unknown") unknownTxIds.push(id);
    }

    return { sensorTxIds, sourceTxIds, hubTxIds, unknownTxIds, BLETxIds, USBTxIds };
  }, [deviceMeta]);
}
