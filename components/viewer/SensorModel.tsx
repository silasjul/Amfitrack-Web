import { Center, useFBX } from "@react-three/drei";
import * as THREE from "three";

export default function SourceModel() {
  const fbx = useFBX("/models/viewer/sensor.fbx");

  return (
    <group position={[2, 0, 2]}>
      <Center>
        <primitive object={fbx} scale={0.01} />
      </Center>
    </group>
  );
}
