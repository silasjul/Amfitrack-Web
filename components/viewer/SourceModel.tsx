import { Center, useFBX, Image } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SOURCE_COLOR } from "./coordinateSystem/config";

useFBX.preload("/models/viewer/source.fbx");

export default function SourceModel() {
  const fbx = useFBX("/models/viewer/source.fbx");
  const clone = useMemo(() => fbx.clone(), [fbx]);
  const lightMaterialRef = useRef<THREE.MeshPhongMaterial | null>(null);
  const lauRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const lightMesh = clone.children[1] as THREE.Mesh;

    const lightMat = (lightMesh.material as THREE.MeshPhongMaterial[])[0];

    const lightMatClone = lightMat.clone();

    lightMatClone.color.set(SOURCE_COLOR);

    lightMaterialRef.current = lightMatClone;
    (lightMesh.material as THREE.MeshPhongMaterial[])[0] = lightMatClone;
  }, [clone]);

  useFrame((_, delta) => {
    if (!lauRef.current) return;
    lauRef.current.rotation.y += delta;
  });

  return (
    <group position={[0, 0.017, 0]}>
      <Center>
        <group ref={lauRef} scale={0.25} position={[0, -0.2, 0]}>
          <Image url="/easterEgg/lau.png" transparent side={THREE.DoubleSide} />
        </group>
        <primitive object={clone} scale={0.01} rotation-x={(Math.PI / 2) * 3} />
      </Center>
    </group>
  );
}
