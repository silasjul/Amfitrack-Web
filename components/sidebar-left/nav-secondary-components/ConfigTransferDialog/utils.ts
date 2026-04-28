import type { DeviceUplink } from "@/amfitrackSDK/src/interfaces/IStore";
import type { ParameterValue } from "@/amfitrackSDK/src/interfaces/IConfigurator";

export function formatUplink(uplink: DeviceUplink): string {
  if (uplink === "ble") return "BLE";
  if (uplink === "usb") return "USB";
  if (uplink === null) return "—";
  return `Hub #${uplink}`;
}

const DELIMITER = ";";
const UTF8_BOM = "\uFEFF";

export interface DeviceExportData {
  name: string;
  uuid: string;
  firmware: string;
  rfFirmware: string;
  hardware: string;
  parameters: { name: string; uid: number; value: ParameterValue }[];
}

export function configurationsToCSV(devices: DeviceExportData[]): string {
  const paramOrder: { name: string; uid: number }[] = [];
  const uidSet = new Set<number>();
  for (const device of devices) {
    for (const param of device.parameters) {
      if (!uidSet.has(param.uid)) {
        uidSet.add(param.uid);
        paramOrder.push({ name: param.name, uid: param.uid });
      }
    }
  }

  const valueLookup = new Map<number, Map<number, ParameterValue>>();
  for (let di = 0; di < devices.length; di++) {
    for (const param of devices[di].parameters) {
      let byDevice = valueLookup.get(param.uid);
      if (!byDevice) {
        byDevice = new Map();
        valueLookup.set(param.uid, byDevice);
      }
      byDevice.set(di, param.value);
    }
  }

  const lines: string[] = [];

  lines.push(csvRow("Name", 0, devices.map((d) => escape(d.name))));
  lines.push(csvRow("UUID", 1, devices.map((d) => escape(`#${d.uuid}`))));
  lines.push(csvRow("FW", 2, devices.map((d) => escape(d.firmware))));
  lines.push(csvRow("RFFW", 3, devices.map((d) => escape(d.rfFirmware))));
  lines.push(csvRow("HW", 4, devices.map((d) => escape(d.hardware))));

  for (const { name, uid } of paramOrder) {
    const values = devices.map((_, di) => {
      const v = valueLookup.get(uid)?.get(di);
      return formatValue(v);
    });
    lines.push(csvRow(escape(name), uid, values));
  }

  return UTF8_BOM + lines.join("\n") + "\n";
}

function formatValue(v: ParameterValue | undefined): string {
  if (v === undefined) return "NA";
  if (typeof v === "boolean") return v ? "True" : "False";
  return escape(String(v));
}

function escape(v: string): string {
  if (v.includes(DELIMITER) || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function csvRow(label: string, id: number, values: string[]): string {
  return [label, id, ...values, ""].join(DELIMITER);
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
