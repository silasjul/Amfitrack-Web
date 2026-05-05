"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  PivotControls,
} from "@react-three/drei";
import { useControls, folder, button, Leva } from "leva";
import Lightsaber from "@/components/starwars/lightsaber/lightsaber";
import Light from "@/components/starwars/light";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useDeviceStore } from "@/amfitrackSDK";
import { useSensorSync } from "@/hooks/useSensorSync";
import useTxIds from "@/hooks/useTxIds";

export default function Home() {
  const resetCenterRef = useRef<() => void>(() => {});

  const { mode, exposure, enabled, pivotOffsetY, files } = useControls({
    toneMapping: folder({
      mode: {
        value: THREE.ReinhardToneMapping as THREE.ToneMapping,
        options: {
          None: THREE.NoToneMapping,
          Linear: THREE.LinearToneMapping,
          Reinhard: THREE.ReinhardToneMapping,
          Cineon: THREE.CineonToneMapping,
          ACESFilmic: THREE.ACESFilmicToneMapping,
        },
      },
      exposure: {
        value: 3,
        min: 0,
        max: 10,
      },
    }),
    pivotControls: folder({
      enabled: {
        value: false,
      },
      pivotOffsetY: {
        value: 0.22,
        min: 0,
        max: 0.5,
        label: "Y",
      },
    }),
    environment: folder({
      files: {
        value: "/star-wars/Deathstar_Hanger_4k.hdr",
        options: {
          "Crashed Star Destroyer": "/star-wars/CrashedStarDestroyer_4k.hdr",
          "Death Star Hangar": "/star-wars/Deathstar_Hanger_4k.hdr",
          "Death Star Tractor Beam": "/star-wars/DeathStar_TractorBeam_4k.hdr",
          "Jabba's Throne Room": "/star-wars/JabbaTHroneRoom_4k.hdr",
          "Maz's Castle": "/star-wars/MazCastle_4k.hdr",
          "Mos Eisley Cantina": "/star-wars/MosEisleyCanteen_4k.hdr",
          "Rebel Base": "/star-wars/RebelBase_4k.hdr",
        },
      },
    }),
    calibration: folder({
      resetCenter: button(() => resetCenterRef.current()),
    }),
  });

  return (
    <div className="relative h-full w-full">
      <Leva collapsed />
      <Canvas
        shadows
        camera={{ position: [0, 0.25, 2], near: 0.1, far: 1000 }}
        gl={{ toneMapping: mode, toneMappingExposure: exposure }}
      >
        <Environment files={files} background />
        <Light />
        <LightsaberScene
          enabled={enabled}
          pivotOffsetY={pivotOffsetY}
          resetCenterRef={resetCenterRef}
        />
      </Canvas>
    </div>
  );
}

function LightsaberScene({
  enabled,
  pivotOffsetY,
  resetCenterRef,
}: {
  enabled: boolean;
  pivotOffsetY: number;
  resetCenterRef: React.RefObject<() => void>;
}) {
  const { sensorTxIds } = useTxIds();
  const txId = sensorTxIds[0];
  const modelRef = useRef<THREE.Group>(null);
  const metalDistortionRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const { resetCenter } = useSensorSync(modelRef, txId);

  resetCenterRef.current = resetCenter;

  useFrame(() => {
    if (txId === undefined) return;
    const data = useDeviceStore.getState().emfImuFrameId[txId];
    if (data) metalDistortionRef.current = data.metalDistortion / 255;
  });

  return (
    <>
      <OrbitControls enabled={!isDragging} />
      <group ref={modelRef}>
        <PivotControls
          enabled={enabled}
          scale={0.6}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
        >
          <group position-z={pivotOffsetY}>
            <Lightsaber metalDistortionRef={metalDistortionRef} />
          </group>
        </PivotControls>
      </group>
    </>
  );
}
