import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { getAudioListener } from "@/hooks/drum/useDrumAudio";

export default function DrumAudioListener() {
  const { camera } = useThree();

  useEffect(() => {
    const listener = getAudioListener();
    camera.add(listener);
    return () => {
      camera.remove(listener);
    };
  }, [camera]);

  return null;
}
