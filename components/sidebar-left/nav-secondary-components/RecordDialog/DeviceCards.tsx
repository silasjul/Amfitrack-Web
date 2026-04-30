import React from "react";
import useTxIds from "@/hooks/useTxIds";
import DeviceCard from "./DeviceCard";

export default function DeviceCards() {
  const { sensorTxIds, sourceTxIds } = useTxIds();

  return (
    <div className="">
      <p className="text-sm font-medium mb-2">Select data to record</p>
      <div className="flex flex-col gap-2">
        {sensorTxIds.map((txId) => (
          <DeviceCard key={txId} txId={txId} />
        ))}
        {sourceTxIds.map((txId) => (
          <DeviceCard key={txId} txId={txId} />
        ))}
      </div>
    </div>
  );
}
