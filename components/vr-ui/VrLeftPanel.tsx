"use client";

import { useRouter } from "next/navigation";
import { Container, Text } from "@react-three/uikit";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from "@react-three/uikit-default";
import {
  useActiveSceneStore,
  type SceneId,
} from "@/stores/useActiveSceneStore";

const SCENES: { id: SceneId; label: string; href: string }[] = [
  { id: "drum-kit", label: "Drum Kit", href: "/demos/drum-kit" },
  { id: "star-wars", label: "Star Wars", href: "/demos/star-wars" },
  { id: "viewer", label: "Viewer", href: "/viewer" },
];

export default function VrLeftPanel() {
  const router = useRouter();
  const activeScene = useActiveSceneStore((s) => s.scene);

  return (
    <Container pixelSize={0.0015} width={300}>
      <Card flexDirection="column" width="100%">
        <CardHeader>
          <CardTitle>
            <Text>Demos</Text>
          </CardTitle>
        </CardHeader>
        <CardContent flexDirection="column" gap={6}>
          {SCENES.map((scene) => (
            <Button
              key={scene.id}
              variant={activeScene === scene.id ? "default" : "ghost"}
              onClick={() => router.push(scene.href)}
            >
              <Text>{scene.label}</Text>
            </Button>
          ))}
        </CardContent>
      </Card>
    </Container>
  );
}
