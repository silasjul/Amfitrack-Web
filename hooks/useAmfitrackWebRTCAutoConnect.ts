"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useIsVRSupported } from "./useIsVRSupported";
import { useAmfitrack } from "@/amfitrackSDK";
import { useWebRTCConnectionStore } from "@/stores/useWebRTCConnectionStore";

const DEFAULT_URL = "wss://192.168.137.1:8080";
const MAX_BACKOFF_MS = 15000;

/**
 * When the browser supports immersive-VR, continuously try to connect the SDK
 * to the local WebRTC bridge so the headset can receive Amfitrack packets
 * from a companion PC. Retries forever with exponential backoff until the
 * bridge accepts; re-runs the connect loop if the bridge later drops.
 *
 * A user-initiated disconnect (via the sidebar) sets a flag in
 * useWebRTCConnectionStore that suppresses retries until cleared.
 */
export function useAmfitrackWebRTCAutoConnect(url: string = DEFAULT_URL): void {
  const { sdk } = useAmfitrack();
  const vrSupported = useIsVRSupported();
  const manuallyDisconnected = useWebRTCConnectionStore(
    (s) => s.manuallyDisconnected,
  );

  useEffect(() => {
    if (!vrSupported || !sdk || manuallyDisconnected) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let disconnectResolver: (() => void) | null = null;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms);
      });

    const waitForDisconnect = () =>
      new Promise<void>((resolve) => {
        disconnectResolver = resolve;
      });

    const onDropped = () => {
      if (!disconnectResolver) return;
      const resolve = disconnectResolver;
      disconnectResolver = null;
      resolve();
    };

    const run = async () => {
      let backoff = 1000;
      while (!cancelled) {
        try {
          await sdk.requestConnectionViaWebRTC(url, onDropped);
          if (cancelled) return;
          backoff = 1000;
          toast.success("Connected to Amfitrack WebRTC bridge");
          await waitForDisconnect();
          if (cancelled) return;
          toast.warning("Lost WebRTC bridge — retrying");
        } catch {
          if (cancelled) return;
          await wait(backoff);
          backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (disconnectResolver) {
        const resolve = disconnectResolver;
        disconnectResolver = null;
        resolve();
      }
    };
  }, [sdk, vrSupported, url, manuallyDisconnected]);
}
