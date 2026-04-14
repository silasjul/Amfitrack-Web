import { Center, useFBX } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COLOR_CLEAN } from "./SensorModel";

export default function SourceModel() {
  const fbx = useFBX("/models/viewer/source.fbx");
  const clone = useMemo(() => fbx.clone(), [fbx]);
  const lightMaterialRef = useRef<THREE.MeshPhongMaterial | null>(null);

  useEffect(() => {
    const lightMesh = clone.children[1] as THREE.Mesh;

    const lightMat = (lightMesh.material as THREE.MeshPhongMaterial[])[0];

    const lightMatClone = lightMat.clone();

    lightMatClone.color.set(COLOR_CLEAN);

    lightMaterialRef.current = lightMatClone;
    (lightMesh.material as THREE.MeshPhongMaterial[])[0] = lightMatClone;
  }, [clone]);

  return (
    <group position={[0, 0.017, 0]}>
      <Center>
        <primitive object={clone} scale={0.01} rotation-x={(Math.PI / 2) * 3} />
      </Center>
    </group>
  );
}
