import { useGLTF } from "@react-three/drei";
import CymbalCollider from "./CymbalCollider";
import * as THREE from "three";

useGLTF.preload("/drum-kit/models/drumset.glb");

export default function RideCymbal() {
  const { nodes, materials } = useGLTF(
    "/drum-kit/models/drumset.glb",
  ) as unknown as {
    nodes: Record<string, THREE.Mesh>;
    materials: Record<string, THREE.Material>;
  };

  return (
    <CymbalCollider
      name="Ride Cymbal"
      cymbalKind="ride"
      px={3.28}
      py={7.869}
      pz={-0.305}
      rx={0.499}
      ry={-0.004}
      rz={0.244}
      discRadius={2.354}
      discHeight={0.487}
      mass={80}
      rotStiffness={2000}
      rotDamping={100}
      rotMass={30}
      angularDamping={0.99}
      linearDamping={0.99}
      meshPx={0.265}
      meshPy={-0.088}
      meshPz={-0.133}
      meshRx={0.436}
      meshRy={0.043}
      meshRz={-0.37}
      meshScale={0.004995}
    >
      <mesh
        geometry={nodes["ride-outer"].geometry}
        material={materials.lambert2}
        castShadow
        receiveShadow
      >
        <mesh
          geometry={nodes["ride-bell"].geometry}
          material={materials.lambert2}
          position={[-59.208, 21.051, 8.975]}
          castShadow
          receiveShadow
        />
      </mesh>
    </CymbalCollider>
  );
}
