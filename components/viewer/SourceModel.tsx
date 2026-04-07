import { Center, useFBX } from "@react-three/drei";
import * as THREE from "three";

export default function SourceModel() {
  const fbx = useFBX("/models/viewer/source.fbx");

  return (
    <Center>
      <primitive
        object={fbx}
        scale={0.01}
        rotation-x={(Math.PI / 2) * 3}
        rotation-z={-Math.PI}
      />
    </Center>
  );
}
