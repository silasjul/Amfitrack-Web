import { useGLTF } from "@react-three/drei";
import CymbalCollider from "./CymbalCollider";
import * as THREE from "three";

useGLTF.preload("/drum-kit/models/drumset.glb");

// Combined drumset scale: Model scale (0.045) * ride_tam_2 group scale (0.111).
// Used as the leva-tweakable default for the mesh's Scale slider.
const RIDE_MESH_SCALE = 0.045 * 0.111;

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
      py={7.63}
      pz={0.03}
      rx={0}
      ry={1.74}
      rz={0}
      discRadius={1.7}
      discHeight={0.1}
      meshScale={RIDE_MESH_SCALE}
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
