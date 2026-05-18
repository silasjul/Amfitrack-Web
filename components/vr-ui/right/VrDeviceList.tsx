"use client";

import { useDeviceStore } from "@/amfitrackSDK";
import type { DeviceKind } from "@/amfitrackSDK";
import { useViewerStore } from "@/stores/useViewerStore";
import useTxIds from "@/hooks/useTxIds";
import { Container, Text } from "@react-three/uikit";
import { Button } from "@react-three/uikit-default";

export default function VrDeviceList() {
  const selectedDeviceId = useViewerStore((s) => s.selectedDeviceId);
  const setSelectedDeviceId = useViewerStore((s) => s.setSelectedDeviceId);
  const frequency = useDeviceStore((s) => s.frequency);
  const { sensorTxIds, sourceTxIds, hubTxIds, unknownTxIds } = useTxIds();

  const rows: { id: number; kind: DeviceKind }[] = [
    ...sensorTxIds.map((id) => ({ id, kind: "sensor" as DeviceKind })),
    ...sourceTxIds.map((id) => ({ id, kind: "source" as DeviceKind })),
    ...hubTxIds.map((id) => ({ id, kind: "hub" as DeviceKind })),
    ...unknownTxIds.map((id) => ({ id, kind: "unknown" as DeviceKind })),
  ];

  if (rows.length === 0) {
    return (
      <Container padding={8}>
        <Text fontSize={11} opacity={0.5}>
          Waiting for devices…
        </Text>
      </Container>
    );
  }

  return (
    <Container flexDirection="column" gap={4} maxHeight={140} overflow="scroll">
      {rows.map(({ id, kind }) => {
        const hz = frequency[id]?.totalHz ?? 0;
        const label = `${kind.charAt(0).toUpperCase()}${kind.slice(1)}_${id}`;
        const selected = selectedDeviceId === id;
        return (
          <Button
            key={`${kind}-${id}`}
            variant={selected ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedDeviceId(id)}
            justifyContent="space-between"
            width="100%"
          >
            <Text fontSize={12}>{label}</Text>
            <Text fontSize={10} opacity={0.6}>
              {hz.toFixed(0)}Hz
            </Text>
          </Button>
        );
      })}
    </Container>
  );
}
