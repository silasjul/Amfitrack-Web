import DrumCollider from "./DrumCollider";

export default function Snare() {
  return (
    <DrumCollider
      name="Snare"
      soundId="snare"
      px={-2.14}
      py={3.591}
      pz={1.44}
      rx={0.1}
      rz={-0.01}
      bodyRadius={1.172}
      bodyHeight={1.04}
    />
  );
}
