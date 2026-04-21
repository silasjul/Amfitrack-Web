import { PayloadType } from "../protocol/AmfitrackDecoder";
import type { DeviceFrequency, DeviceStoreApi } from "../interfaces/IStore";
import type { IFrequencyTracker } from "../interfaces/IFrequencyTracker";

const FREQUENCY_INTERVAL_MS = 200;

export class FrequencyTracker implements IFrequencyTracker {
  private store: DeviceStoreApi;
  private packetCounts: Map<number, Map<PayloadType, number>> = new Map();
  private lastFrequencyTime = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(store: DeviceStoreApi) {
    this.store = store;
  }

  public trackPacket(txId: number, payloadType: PayloadType): void {
    let typeCounts = this.packetCounts.get(txId);
    if (!typeCounts) {
      typeCounts = new Map();
      this.packetCounts.set(txId, typeCounts);
    }
    typeCounts.set(payloadType, (typeCounts.get(payloadType) ?? 0) + 1);
  }

  public start(): void {
    this.stop();
    this.lastFrequencyTime = performance.now();
    this.packetCounts.clear();

    this.intervalId = setInterval(() => {
      const now = performance.now();
      const elapsedSec = (now - this.lastFrequencyTime) / 1000;
      if (elapsedSec <= 0) return;

      const result: Record<number, DeviceFrequency> = {};
      for (const [txId, typeCounts] of this.packetCounts) {
        let totalHz = 0;
        const byPayloadType: Partial<Record<PayloadType, number>> = {};
        for (const [pType, count] of typeCounts) {
          const hz = count / elapsedSec;
          byPayloadType[pType] = hz;
          totalHz += hz;
        }
        result[txId] = { totalHz, byPayloadType };
      }

      this.store.getState().updateFrequencies(result);
      this.packetCounts.clear();
      this.lastFrequencyTime = now;
    }, FREQUENCY_INTERVAL_MS);
  }

  public stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
