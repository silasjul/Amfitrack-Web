import { useGLTF } from "@react-three/drei";
import CymbalCollider from "./CymbalCollider";
import * as THREE from "three";

useGLTF.preload("/drum-kit/models/drumset.glb");

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
      px={-3.38}
      py={7.162}
      pz={-0.198}
      rx={0.398}
      ry={-0.211}
      rz={-0.313}
      discRadius={1.487}
      discHeight={0.45}
      mass={25}
      rotStiffness={1800}
      rotDamping={80}
      rotMass={12}
      angularDamping={0.98}
      linearDamping={0.95}
      meshPx={0.093}
      meshPy={0.044}
      meshPz={-0.069}
      meshRx={0.36}
      meshRy={0.584}
      meshRz={0.206}
      meshScale={0.004895}
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
