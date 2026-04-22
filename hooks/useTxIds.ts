import { useDeviceStore } from "@/amfitrackSDK/src/store/useDeviceStore";
import { useMemo } from "react";

export interface UseTxIdsResult {
  sensorTxIds: number[];
  sourceTxIds: number[];
  hubTxIds: number[];
  BLETxIds: number[];
  USBTxIds: number[];
}

export default function useTxIds(): UseTxIdsResult {
  const deviceMeta = useDeviceStore((s) => s.deviceMeta);

  return useMemo(() => {
    const sensorTxIds: number[] = [];
    const sourceTxIds: number[] = [];
    const hubTxIds: number[] = [];
    const BLETxIds: number[] = [];
    const USBTxIds: number[] = [];

    for (const key of Object.keys(deviceMeta)) {
      const id = Number(key);
      if (!Number.isFinite(id)) continue;

      const meta = deviceMeta[id];
      if (!meta) continue;

      if (meta.kind === "sensor") sensorTxIds.push(id);
      else if (meta.kind === "source") sourceTxIds.push(id);
      else if (meta.kind === "hub") hubTxIds.push(id);

      if (meta.uplink === "ble") BLETxIds.push(id);
      else if (meta.uplink === "usb") USBTxIds.push(id);
    }

    return { sensorTxIds, sourceTxIds, hubTxIds, BLETxIds, USBTxIds };
  }, [deviceMeta]);
}
