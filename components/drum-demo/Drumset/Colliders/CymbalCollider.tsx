import {
  useCompoundBody,
  useParticle,
  usePointToPointConstraint,
} from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { folder, useControls, button } from "leva";
import { ReactNode, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useDrumDemoStore } from "@/stores/useDrumDemoStore";

export type CymbalKind = "ride" | "crash";

type Vec3Tuple = [number, number, number];
type QuatTuple = [number, number, number, number];

interface CymbalColliderProps {
  name: string;
  cymbalKind: CymbalKind;
  px?: number;
  py?: number;
  pz?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  discRadius?: number;
  discHeight?: number;
  bellRadius?: number;
  bellOffsetY?: number;
  mass?: number;
  meshPx?: number;
  meshPy?: number;
  meshPz?: number;
  meshRx?: number;
  meshRy?: number;
  meshRz?: number;
  meshScale?: number;
  children?: ReactNode;
}

export default function CymbalCollider({
  name,
  cymbalKind,
  px: propPx = 0,
  py: propPy = 4,
  pz: propPz = 0,
  rx: propRx = 0,
  ry: propRy = 0,
  rz: propRz = 0,
  discRadius: propDiscRadius = 1.5,
  discHeight: propDiscHeight = 0.1,
  bellRadius: propBellRadius = 0.35,
  bellOffsetY: propBellOffsetY = 0.1,
  mass: propMass = 0.5,
  meshPx: propMeshPx = 0,
  meshPy: propMeshPy = 0,
  meshPz: propMeshPz = 0,
  meshRx: propMeshRx = 0,
  meshRy: propMeshRy = 0,
  meshRz: propMeshRz = 0,
  meshScale: propMeshScale = 1,
  children,
}: CymbalColliderProps) {
  const currentValuesRef = useRef<any>(null);
  const isDebug = useDrumDemoStore((s) => s.isDebug);

  const {
    px,
    py,
    pz,
    rx,
    ry,
    rz,
    discRadius,
    discHeight,
    bellRadius,
    bellOffsetY,
    mass,
    rotStiffness,
    rotDamping,
    rotMass,
    angularDamping,
    linearDamping,
    meshPx,
    meshPy,
    meshPz,
    meshRx,
    meshRy,
    meshRz,
    meshScale,
  } = useControls(
    name,
    {
      Body: folder({
        px: { value: propPx, min: -10, max: 10, step: 0.001, label: "X" },
        py: { value: propPy, min: -2, max: 12, step: 0.001, label: "Y" },
        pz: { value: propPz, min: -10, max: 10, step: 0.001, label: "Z" },
        rx: {
          value: propRx,
          min: -Math.PI,
          max: Math.PI,
          step: 0.001,
          label: "Rotation X",
        },
        ry: {
          value: propRy,
          min: -Math.PI,
          max: Math.PI,
          step: 0.001,
          label: "Rotation Y",
        },
        rz: {
          value: propRz,
          min: -Math.PI,
          max: Math.PI,
          step: 0.001,
          label: "Rotation Z",
        },
      }),
      Mesh: folder({
        meshPx: {
          value: propMeshPx,
          min: -5,
          max: 5,
          step: 0.001,
          label: "Offset X",
        },
        meshPy: {
          value: propMeshPy,
          min: -5,
          max: 5,
          step: 0.001,
          label: "Offset Y",
        },
        meshPz: {
          value: propMeshPz,
          min: -5,
          max: 5,
          step: 0.001,
          label: "Offset Z",
        },
        meshRx: {
          value: propMeshRx,
          min: -Math.PI,
          max: Math.PI,
          step: 0.001,
          label: "Rotation X",
        },
        meshRy: {
          value: propMeshRy,
          min: -Math.PI,
          max: Math.PI,
          step: 0.001,
          label: "Rotation Y",
        },
        meshRz: {
          value: propMeshRz,
          min: -Math.PI,
          max: Math.PI,
          step: 0.001,
          label: "Rotation Z",
        },
        meshScale: {
          value: propMeshScale,
          min: 0.0001,
          max: 0.1,
          step: 0.0001,
          label: "Scale",
        },
      }),
      Disc: folder({
        discRadius: {
          value: propDiscRadius,
          min: 0.1,
          max: 4,
          step: 0.001,
          label: "Radius",
        },
        discHeight: {
          value: propDiscHeight,
          min: 0.01,
          max: 1,
          step: 0.001,
          label: "Height",
        },
      }),
      Bell: folder({
        bellRadius: {
          value: propBellRadius,
          min: 0.05,
          max: 1.5,
          step: 0.001,
          label: "Radius",
        },
        bellOffsetY: {
          value: propBellOffsetY,
          min: -0.5,
          max: 1,
          step: 0.001,
          label: "Y Offset",
        },
      }),
      Physics: folder({
        mass: { value: propMass, min: 0.01, max: 5, step: 0.001, label: "Mass" },
        rotStiffness: {
          value: 200,
          min: 0,
          max: 2000,
          step: 1,
          label: "Spring Stiffness",
        },
        rotDamping: {
          value: 8,
          min: 0,
          max: 100,
          step: 0.1,
          label: "Spring Damping",
        },
        rotMass: {
          value: 1,
          min: 0.01,
          max: 10,
          step: 0.01,
          label: "Spring Mass",
        },
        angularDamping: {
          value: 0.4,
          min: 0,
          max: 1,
          step: 0.01,
          label: "Angular Damping",
        },
        linearDamping: {
          value: 0.1,
          min: 0,
          max: 1,
          step: 0.01,
          label: "Linear Damping",
        },
      }),
      logValues: button(() => {
        console.log(
          `[CymbalCollider "${name}" values]`,
          currentValuesRef.current,
        );
      }),
    },
    { collapsed: true },
  );

  currentValuesRef.current = {
    px,
    py,
    pz,
    rx,
    ry,
    rz,
    discRadius,
    discHeight,
    bellRadius,
    bellOffsetY,
    mass,
    rotStiffness,
    rotDamping,
    rotMass,
    angularDamping,
    linearDamping,
    meshPx,
    meshPy,
    meshPz,
    meshRx,
    meshRy,
    meshRz,
    meshScale,
  };

  // Shape/material changes require recreating the body. Pose changes don't —
  // those go through the api so the user can drag sliders without remounting.
  const shapeDeps = [
    discRadius,
    discHeight,
    bellRadius,
    bellOffsetY,
    mass,
    angularDamping,
    linearDamping,
  ];

  // Static anchor — point in space used as the pivot reference.
  const [anchorRef, anchorApi] = useParticle(
    () => ({
      type: "Static",
      position: [propPx, propPy, propPz],
    }),
    undefined,
    [],
  );

  // Dynamic compound body. Initial pose comes from the latest leva values when
  // the body (re)mounts; live pose edits are applied via api below.
  const [bodyRef, api] = useCompoundBody(
    () => ({
      type: "Dynamic",
      mass,
      position: [px, py, pz],
      rotation: [rx, ry, rz],
      angularDamping,
      linearDamping,
      shapes: [
        {
          type: "Cylinder",
          args: [discRadius, discRadius, discHeight, 16],
          position: [0, 0, 0] as Vec3Tuple,
          rotation: [0, 0, 0] as Vec3Tuple,
        },
        {
          type: "Sphere",
          args: [bellRadius] as [number],
          position: [0, bellOffsetY, 0] as Vec3Tuple,
        },
      ],
    }),
    undefined,
    shapeDeps,
  );

  // Pivot: lock cymbal's center to the anchor's center. Free rotation around it.
  usePointToPointConstraint(
    anchorRef,
    bodyRef,
    {
      pivotA: [0, 0, 0],
      pivotB: [0, 0, 0],
    },
    shapeDeps,
  );

  // Live physics state (subscribed from worker)
  const physicsQuat = useRef<QuatTuple>([0, 0, 0, 1]);
  const physicsAngVel = useRef<Vec3Tuple>([0, 0, 0]);

  useEffect(() => {
    const unsubs = [
      api.quaternion.subscribe((q) => (physicsQuat.current = q)),
      api.angularVelocity.subscribe((v) => (physicsAngVel.current = v)),
    ];
    return () => unsubs.forEach((u) => u());
  }, [api.quaternion, api.angularVelocity]);

  // When pose leva values change, snap body + anchor to the new pose, zero out
  // velocities, and pre-seed the physics refs so the spring doesn't try to
  // "correct" the change and send the cymbal spinning.
  useEffect(() => {
    anchorApi.position.set(px, py, pz);
    api.position.set(px, py, pz);

    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
    api.quaternion.set(q.x, q.y, q.z, q.w);
    api.velocity.set(0, 0, 0);
    api.angularVelocity.set(0, 0, 0);

    physicsQuat.current = [q.x, q.y, q.z, q.w];
    physicsAngVel.current = [0, 0, 0];
  }, [
    px,
    py,
    pz,
    rx,
    ry,
    rz,
    anchorApi.position,
    api.position,
    api.quaternion,
    api.velocity,
    api.angularVelocity,
  ]);

  const work = useMemo(
    () => ({
      currentQuat: new THREE.Quaternion(),
      targetQuat: new THREE.Quaternion(),
      diffQuat: new THREE.Quaternion(),
      currentAngVel: new THREE.Vector3(),
      torque: new THREE.Vector3(),
      euler: new THREE.Euler(),
    }),
    [],
  );

  // Restoring rotation spring — pulls the cymbal back toward its default rotation.
  useFrame((_, delta) => {
    work.currentQuat.fromArray(physicsQuat.current);
    work.currentAngVel.fromArray(physicsAngVel.current);
    work.targetQuat.setFromEuler(work.euler.set(rx, ry, rz));

    if (work.currentQuat.dot(work.targetQuat) < 0) {
      work.targetQuat.set(
        -work.targetQuat.x,
        -work.targetQuat.y,
        -work.targetQuat.z,
        -work.targetQuat.w,
      );
    }

    work.diffQuat.copy(work.currentQuat).invert().premultiply(work.targetQuat);

    const w = Math.max(-1, Math.min(1, work.diffQuat.w));
    const angle = 2 * Math.acos(w);
    const sinHalf = Math.sqrt(1 - w * w);
    const invS = sinHalf < 0.001 ? 0 : 1 / sinHalf;

    work.torque
      .set(
        work.diffQuat.x * invS,
        work.diffQuat.y * invS,
        work.diffQuat.z * invS,
      )
      .multiplyScalar(angle * rotStiffness)
      .addScaledVector(work.currentAngVel, -rotDamping);

    // Clamp to keep transient mismatches from launching the cymbal.
    work.torque.clampLength(0, 500);

    work.currentAngVel.addScaledVector(work.torque, delta / rotMass);
    api.angularVelocity.set(
      work.currentAngVel.x,
      work.currentAngVel.y,
      work.currentAngVel.z,
    );
  });

  return (
    <>
      {/* Cymbal physics body — children render in body-local space and follow rotation */}
      <group ref={bodyRef}>
        <group
          position={[meshPx, meshPy, meshPz]}
          rotation={[meshRx, meshRy, meshRz]}
          scale={meshScale}
        >
          {children}
        </group>
        {isDebug && (
          <>
            <mesh>
              <cylinderGeometry args={[discRadius, discRadius, discHeight, 16]} />
              <meshBasicMaterial color="lime" wireframe />
            </mesh>
            <mesh position={[0, bellOffsetY, 0]}>
              <sphereGeometry args={[bellRadius, 10, 10]} />
              <meshBasicMaterial color="yellow" wireframe />
            </mesh>
          </>
        )}
      </group>

      {/* Static anchor (particle, no shape) */}
      <group ref={anchorRef} />

      {/* Visible marker for the anchor / pivot point */}
      <mesh position={[px, py, pz]}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshBasicMaterial color="cyan" wireframe visible={isDebug} />
      </mesh>
    </>
  );
}
