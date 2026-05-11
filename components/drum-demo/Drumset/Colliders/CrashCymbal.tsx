import { useGLTF } from "@react-three/drei";
import CymbalCollider from "./CymbalCollider";
import * as THREE from "three";

useGLTF.preload("/drum-kit/models/drumset.glb");

// Combined drumset scale: Model scale (0.045) * crash005 group scale (0.111).
const CRASH_MESH_SCALE = 0.045 * 0.111;

export default function CrashCymbal() {
  const { nodes, materials } = useGLTF(
    "/drum-kit/models/drumset.glb",
  ) as unknown as {
    nodes: Record<string, THREE.Mesh>;
    materials: Record<string, THREE.Material>;
  };

  return (
    <CymbalCollider
      name="Crash Cymbal"
      cymbalKind="crash"
      px={-3.32}
      py={7.01}
      pz={-0.04}
      rx={0}
      ry={0}
      rz={0}
      discRadius={1.3}
      discHeight={0.1}
      bellRadius={0.3}
      bellOffsetY={0.1}
      meshScale={CRASH_MESH_SCALE}
    >
      <mesh
        geometry={nodes.crash003.geometry}
        material={materials.lambert2}
        castShadow
        receiveShadow
      />
    </CymbalCollider>
  );
}
