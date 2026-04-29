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

  lines.push(
    csvRow(
      "UUID",
      0,
      devices.map((d) => escape(`#${d.uuid}`)),
    ),
  );
  lines.push(
    csvRow(
      "Name",
      1,
      devices.map((d) => escape(d.name)),
    ),
  );
  lines.push(
    csvRow(
      "FW",
      2,
      devices.map((d) => escape(d.firmware)),
    ),
  );
  lines.push(
    csvRow(
      "RFFW",
      3,
      devices.map((d) => escape(d.rfFirmware)),
    ),
  );
  lines.push(
    csvRow(
      "HW",
      4,
      devices.map((d) => escape(d.hardware)),
    ),
  );

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

function parseValue(raw: string): ParameterValue {
  if (raw === "True") return true;
  if (raw === "False") return false;
  const num = Number(raw);
  if (raw !== "" && !Number.isNaN(num)) return num;
  return raw;
}

function splitCsvRow(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === DELIMITER) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

const META_ROW_COUNT = 5;

export function parseConfigCSV(csv: string): DeviceExportData[] {
  const content = csv.startsWith(UTF8_BOM) ? csv.slice(1) : csv;
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < META_ROW_COUNT) return [];

  const metaRows = lines.slice(0, META_ROW_COUNT).map(splitCsvRow);
  const paramRows = lines.slice(META_ROW_COUNT).map(splitCsvRow);

  const firstRow = metaRows[0];
  let lastNonEmpty = firstRow.length - 1;
  while (lastNonEmpty >= 2 && firstRow[lastNonEmpty].trim() === "") {
    lastNonEmpty--;
  }
  const deviceCount = lastNonEmpty - 1;
  if (deviceCount <= 0) return [];

  const devices: DeviceExportData[] = [];

  for (let di = 0; di < deviceCount; di++) {
    const col = di + 2;
    const uuidRaw = metaRows[0][col] ?? "";
    devices.push({
      uuid: uuidRaw.startsWith("#") ? uuidRaw.slice(1) : uuidRaw,
      name: metaRows[1][col] ?? "unknown",
      firmware: metaRows[2][col] ?? "unknown",
      rfFirmware: metaRows[3][col] ?? "unknown",
      hardware: metaRows[4][col] ?? "unknown",
      parameters: [],
    });
  }

  for (const row of paramRows) {
    const name = row[0] ?? "";
    const uid = Number(row[1]);
    if (!name || Number.isNaN(uid)) continue;

    for (let di = 0; di < deviceCount; di++) {
      const raw = row[di + 2];
      if (raw === undefined || raw === "NA" || raw.trim() === "") continue;
      devices[di].parameters.push({ name, uid, value: parseValue(raw) });
    }
  }

  return devices;
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
