import { Center, useFBX } from "@react-three/drei";
import * as THREE from "three";

export default function SourceModel() {
  const fbx = useFBX("/models/viewer/source.fbx");

  return (
    <group position={[0, 0.017, 0]}>
      <Center>
        <primitive object={fbx} scale={0.01} rotation-x={(Math.PI / 2) * 3} />
      </Center>
    </group>
  );
}
