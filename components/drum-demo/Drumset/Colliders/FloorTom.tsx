import DrumCollider from "./DrumCollider";

export default function FloorTom() {
  return (
    <DrumCollider
      name="Floor Tom"
      drumKind="floor_tom"
      px={2.19}
      py={2.56}
      pz={1.68}
      rx={0}
      rz={0}
      bodyRadius={1.34}
      bodyHeight={2.64}
    />
  );
}
