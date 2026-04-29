import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DeviceMeta } from "@/amfitrackSDK/src/interfaces/IStore";
import type { DeviceExportData } from "@/lib/csv";

interface ImportDeviceRowProps {
  txId: number;
  meta: DeviceMeta | undefined;
  configs: DeviceExportData[];
  selectedConfigIndex: string | undefined;
  onSelectConfig: (txId: number, configIndex: string) => void;
  disabled?: boolean;
}

function truncateUuid(uuid: string, maxLen = 12) {
  return uuid.length > maxLen ? `${uuid.slice(0, maxLen)}…` : uuid;
}

export default function ImportDeviceRow({
  txId,
  meta,
  configs,
  selectedConfigIndex,
  onSelectConfig,
  disabled,
}: ImportDeviceRowProps) {
  return (
    <TableRow>
      <TableCell className="font-mono font-medium">{txId}</TableCell>
      <TableCell>
        {meta ? <Badge className="capitalize">{meta.kind}</Badge> : "—"}
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground max-w-[160px]">
        <span className="block truncate" title={meta?.uuid}>
          {meta?.uuid ?? "—"}
        </span>
      </TableCell>
      <TableCell>
        <Select
          value={selectedConfigIndex ?? ""}
          onValueChange={(v) => onSelectConfig(txId, v)}
          disabled={disabled}
        >
          <SelectTrigger size="sm" className="w-[200px]">
            <SelectValue placeholder="Select config…" />
          </SelectTrigger>
          <SelectContent>
            {configs.map((cfg, i) => (
              <SelectItem key={i} value={String(i)}>
                {cfg.name} ({truncateUuid(cfg.uuid)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
}
