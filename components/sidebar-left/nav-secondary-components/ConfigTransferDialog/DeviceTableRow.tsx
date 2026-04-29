import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { DeviceMeta } from "@/amfitrackSDK/src/interfaces/IStore";
import { formatUplink } from "../../../../lib/csv";

interface DeviceTableRowProps {
  id: number;
  meta: DeviceMeta | undefined;
  selected: boolean;
  onToggle: (id: number, checked: boolean) => void;
}

export default function DeviceTableRow({
  id,
  meta,
  selected,
  onToggle,
}: DeviceTableRowProps) {
  return (
    <TableRow
      data-state={selected ? "selected" : undefined}
      className="cursor-pointer"
      onClick={() => onToggle(id, !selected)}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          onCheckedChange={(v) => onToggle(id, !!v)}
          aria-label={`Select device ${id}`}
        />
      </TableCell>
      <TableCell className="font-mono font-medium">{id}</TableCell>
      <TableCell>
        {meta ? <Badge className="capitalize">{meta.kind}</Badge> : "—"}
      </TableCell>
      <TableCell className="text-sm">
        {meta ? formatUplink(meta.uplink) : "—"}
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground max-w-[160px]">
        <span className="block truncate" title={meta?.uuid}>
          {meta?.uuid ?? "—"}
        </span>
      </TableCell>
      <TableCell className="text-sm">
        {meta?.versions?.firmware ?? "—"}
      </TableCell>
      <TableCell className="text-sm">{meta?.versions?.RF ?? "—"}</TableCell>
      <TableCell className="text-sm max-w-[115px]">
        {meta?.versions?.hardware ?? "—"}
      </TableCell>
    </TableRow>
  );
}
