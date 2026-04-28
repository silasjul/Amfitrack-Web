import type { DeviceUplink } from "@/amfitrackSDK/src/interfaces/IStore";

export function formatUplink(uplink: DeviceUplink): string {
  if (uplink === "ble") return "BLE";
  if (uplink === "usb") return "USB";
  if (uplink === null) return "—";
  return `Hub #${uplink}`;
}
