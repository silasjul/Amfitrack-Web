type Vec3 = [number, number, number];

// Latest worker-reported velocity per drumstick body, keyed by the body's
// THREE.Object3D uuid. Cannon collide events expose `e.body` (the other body)
// as that same Object3D, so DrumCollider can look up the hitting stick's
// current velocity via `e.body.uuid` at collision time.
const velocities = new Map<string, Vec3>();

export function setDrumstickVelocity(uuid: string, v: Vec3) {
  velocities.set(uuid, v);
}

export function getDrumstickVelocity(uuid: string): Vec3 | undefined {
  return velocities.get(uuid);
}

export function clearDrumstickVelocity(uuid: string) {
  velocities.delete(uuid);
}
