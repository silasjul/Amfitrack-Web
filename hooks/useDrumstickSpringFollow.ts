import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useCompoundBody } from "@react-three/cannon";
import { folder, useControls } from "leva";
import * as THREE from "three";

type CompoundBodyApi = ReturnType<typeof useCompoundBody>[1];
type Vec3Tuple = [number, number, number];
type QuatTuple = [number, number, number, number];

export function useDrumstickSpringFollow(
  api: CompoundBodyApi,
  sensorPointRef: React.RefObject<THREE.Mesh> | undefined,
) {
  const {
    posStiffness,
    posDamping,
    posMass,
    rotStiffness,
    rotDamping,
    rotMass,
  } = useControls({
    drumPhysics: folder({
      Position: folder({
        posStiffness: {
          value: 400,
          min: 0,
          max: 2000,
          step: 1,
          label: "Stiffness",
        },
        posDamping: {
          value: 40,
          min: 0,
          max: 200,
          step: 0.1,
          label: "Damping",
        },
        posMass: {
          value: 1,
          min: 0.01,
          max: 10,
          step: 0.01,
          label: "Mass",
        },
      }),
      Rotation: folder({
        rotStiffness: {
          value: 400,
          min: 0,
          max: 2000,
          step: 1,
          label: "Stiffness",
        },
        rotDamping: {
          value: 40,
          min: 0,
          max: 200,
          step: 0.1,
          label: "Damping",
        },
        rotMass: {
          value: 1,
          min: 0.01,
          max: 10,
          step: 0.01,
          label: "Mass",
        },
      }),
    }),
  });

  // Latest physics state, updated via worker subscriptions
  const physicsPosition = useRef<Vec3Tuple>([0, 0, 0]);
  const physicsQuaternion = useRef<QuatTuple>([0, 0, 0, 1]);
  const physicsVelocity = useRef<Vec3Tuple>([0, 0, 0]);
  const physicsAngularVelocity = useRef<Vec3Tuple>([0, 0, 0]);

  // Reused per-frame to avoid GC pressure
  const work = useMemo(
    () => ({
      currentPos: new THREE.Vector3(),
      currentVel: new THREE.Vector3(),
      currentAngVel: new THREE.Vector3(),
      currentQuat: new THREE.Quaternion(),
      targetQuat: new THREE.Quaternion(),
      diffQuat: new THREE.Quaternion(),
      force: new THREE.Vector3(),
      torque: new THREE.Vector3(),
    }),
    [],
  );

  useEffect(() => {
    const unsubs = [
      api.position.subscribe((v) => (physicsPosition.current = v)),
      api.quaternion.subscribe((q) => (physicsQuaternion.current = q)),
      api.velocity.subscribe((v) => (physicsVelocity.current = v)),
      api.angularVelocity.subscribe(
        (v) => (physicsAngularVelocity.current = v),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [api.position, api.quaternion, api.velocity, api.angularVelocity]);

  useFrame((_, delta) => {
    if (!sensorPointRef?.current) return;

    // ---------- Position spring ----------
    work.currentPos.fromArray(physicsPosition.current);
    work.currentVel.fromArray(physicsVelocity.current);

    // F = k * (target - current) - c * velocity
    work.force
      .subVectors(sensorPointRef.current.position, work.currentPos)
      .multiplyScalar(posStiffness)
      .addScaledVector(work.currentVel, -posDamping);

    // v += (F / m) * dt
    work.currentVel.addScaledVector(work.force, delta / posMass);
    api.velocity.set(work.currentVel.x, work.currentVel.y, work.currentVel.z);

    // ---------- Rotation spring ----------
    work.currentQuat.fromArray(physicsQuaternion.current);
    work.currentAngVel.fromArray(physicsAngularVelocity.current);
    work.targetQuat.copy(sensorPointRef.current.quaternion);

    // Quaternions can spin the long way; flip to the short path.
    if (work.currentQuat.dot(work.targetQuat) < 0) {
      work.targetQuat.set(
        -work.targetQuat.x,
        -work.targetQuat.y,
        -work.targetQuat.z,
        -work.targetQuat.w,
      );
    }

    // diff = target * inverse(current)
    work.diffQuat.copy(work.currentQuat).invert().premultiply(work.targetQuat);

    // Convert quaternion difference to scaled axis-angle vector
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

    work.currentAngVel.addScaledVector(work.torque, delta / rotMass);
    api.angularVelocity.set(
      work.currentAngVel.x,
      work.currentAngVel.y,
      work.currentAngVel.z,
    );
  });
}
