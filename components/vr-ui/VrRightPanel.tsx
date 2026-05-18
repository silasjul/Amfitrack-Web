"use client";

import { Container, Text } from "@react-three/uikit";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@react-three/uikit-default";
import { useState } from "react";
import VrDeviceList from "./right/VrDeviceList";
import VrInspectTab from "./right/VrInspectTab";
import VrViewTab from "./right/VrViewTab";

export default function VrRightPanel() {
  const [tab, setTab] = useState<"inspect" | "view">("inspect");

  return (
    <Container pixelSize={0.0015} width={360}>
      <Card flexDirection="column" width="100%" gap={8}>
        <CardHeader>
          <CardTitle>
            <Text>Devices</Text>
          </CardTitle>
        </CardHeader>
        <CardContent flexDirection="column" gap={8}>
          <VrDeviceList />
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "inspect" | "view")}
            width="100%"
          >
            <TabsList width="100%">
              <TabsTrigger value="inspect" flexGrow={1}>
                <Text>Inspect</Text>
              </TabsTrigger>
              <TabsTrigger value="view" flexGrow={1}>
                <Text>View</Text>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="inspect">
              <VrInspectTab />
            </TabsContent>
            <TabsContent value="view">
              <VrViewTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </Container>
  );
}
