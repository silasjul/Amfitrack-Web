"use client";

import { useEffect, useState } from "react";
import { useDeviceStore } from "@/amfitrackSDK";
import type { EmfImuFrameIdData } from "@/amfitrackSDK";
import { useViewerStore } from "@/stores/useViewerStore";
import { Container, Text } from "@react-three/uikit";

export default function VrInspectTab() {
  const selectedDeviceId = useViewerStore((s) => s.selectedDeviceId);
  const [data, setData] = useState<EmfImuFrameIdData | null>(null);

  useEffect(() => {
    if (selectedDeviceId == null) return;
    const read = () => {
      const entry = useDeviceStore.getState().emfImuFrameId[selectedDeviceId];
      if (entry) setData(entry);
    };
    read();
    const interval = setInterval(read, 100);
    return () => clearInterval(interval);
  }, [selectedDeviceId]);

  if (selectedDeviceId == null) {
    return (
      <Container padding={12}>
        <Text fontSize={11} opacity={0.4}>
          Select a device to inspect
        </Text>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container padding={12}>
        <Text fontSize={11} opacity={0.4}>
          Waiting for data…
        </Text>
      </Container>
    );
  }

  return (
    <Container flexDirection="column" gap={8} padding={8}>
      <Section title={`SENSOR_${selectedDeviceId}`} />
      <Section title="Position">
        <Row>
          <Cell label="X" value={data.position.x.toFixed(2)} />
          <Cell label="Y" value={data.position.y.toFixed(2)} />
          <Cell label="Z" value={data.position.z.toFixed(2)} />
        </Row>
      </Section>
      <Section title="Orientation">
        <Row>
          <Cell label="X" value={data.quaternion.x.toFixed(3)} />
          <Cell label="Y" value={data.quaternion.y.toFixed(3)} />
          <Cell label="Z" value={data.quaternion.z.toFixed(3)} />
          <Cell label="W" value={data.quaternion.w.toFixed(3)} />
        </Row>
      </Section>
      <Section title="Accelerometer (g)">
        <Row>
          <Cell label="X" value={data.imu.acc_x.toFixed(2)} />
          <Cell label="Y" value={data.imu.acc_y.toFixed(2)} />
          <Cell label="Z" value={data.imu.acc_z.toFixed(2)} />
        </Row>
      </Section>
      <Section title="Gyroscope (deg/s)">
        <Row>
          <Cell label="X" value={data.imu.gyro_x.toFixed(1)} />
          <Cell label="Y" value={data.imu.gyro_y.toFixed(1)} />
          <Cell label="Z" value={data.imu.gyro_z.toFixed(1)} />
        </Row>
      </Section>
      <Section title="Environment">
        <Row>
          <Cell label="Temp" value={`${data.temperature.toFixed(1)}°C`} />
          <Cell label="RSSI" value={String(data.rssi)} />
        </Row>
      </Section>
    </Container>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <Container flexDirection="column" gap={4}>
      <Text fontSize={9} opacity={0.5} letterSpacing={1}>
        {title.toUpperCase()}
      </Text>
      {children}
    </Container>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <Container flexDirection="row" gap={4}>
      {children}
    </Container>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <Container
      flexDirection="column"
      flexGrow={1}
      padding={4}
      borderRadius={4}
      backgroundColor="rgba(255,255,255,0.06)"
    >
      <Text fontSize={8} opacity={0.4}>
        {label}
      </Text>
      <Text fontSize={11}>{value}</Text>
    </Container>
  );
}
