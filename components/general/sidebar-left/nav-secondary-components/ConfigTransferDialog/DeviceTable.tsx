import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DeviceMeta } from "@/amfitrackSDK/src/interfaces/IStore";
import DeviceTableRow from "./DeviceTableRow";

interface DeviceTableProps {
  allIds: number[];
  deviceMeta: Record<number, DeviceMeta>;
  selectedIds: Set<number>;
  onToggleAll: (checked: boolean) => void;
  onToggleRow: (id: number, checked: boolean) => void;
}

export default function DeviceTable({
  allIds,
  deviceMeta,
  selectedIds,
  onToggleAll,
  onToggleRow,
}: DeviceTableProps) {
  const allSelected = allIds.length > 0 && selectedIds.size === allIds.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < allIds.length;

  return (
    <ScrollArea className="h-full min-h-0 rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={(v) => onToggleAll(!!v)}
                aria-label="Select all devices"
              />
            </TableHead>
            <TableHead>TX ID</TableHead>
            <TableHead>Kind</TableHead>
            <TableHead>Uplink</TableHead>
            <TableHead>UUID</TableHead>
            <TableHead>Firmware</TableHead>
            <TableHead>RF</TableHead>
            <TableHead>Hardware</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allIds.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-muted-foreground py-10"
              >
                No devices connected
              </TableCell>
            </TableRow>
          ) : (
            allIds.map((id) => (
              <DeviceTableRow
                key={id}
                id={id}
                meta={deviceMeta[id]}
                selected={selectedIds.has(id)}
                onToggle={onToggleRow}
              />
            ))
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
