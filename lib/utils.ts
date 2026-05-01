import { DeviceKind } from "@/amfitrackSDK/src/interfaces/IStore";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const KindIconMap: Partial<Record<DeviceKind, string>> = {
  hub: "/hub.png",
  source: "/source.png",
  sensor: "/sensor.png",
};