"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  PivotControls,
  Center,
} from "@react-three/drei";
import { useControls, folder, button } from "leva";
import Lightsaber from "@/components/lightsaber/Lightsaber";
import Light from "@/components/Light";
import { useEffect, useState, useRef } from "react";
import { useAmfitrack } from "@/hooks/useAmfitrack";

export default function Home() {
  const lightsaberRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false);
  const {
    modelRef,
    resetCenter,
    startReading,
    stopReading,
    hubRef,
    metalDistortionRef,
  } = useAmfitrack();

  useEffect(() => {
    if (hubRef.current) {
      startReading(hubRef.current);
    }

    return () => {
      stopReading();
    };
  }, [hubRef.current]);

  const { mode, exposure, enabled, pivotOffsetY, files } = useControls({
    toneMapping: folder({
      mode: {
        value: THREE.ReinhardToneMapping as THREE.ToneMapping,
        options: {
          None: THREE.NoToneMapping,
          Linear: THREE.LinearToneMapping, // Default
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
        value: "environmentMaps/Deathstar_Hanger_4k.hdr",
        options: {
          "Crashed Star Destroyer":
            "environmentMaps/CrashedStarDestroyer_4k.hdr",
          "Death Star Hangar": "environmentMaps/Deathstar_Hanger_4k.hdr",
          "Death Star Tractor Beam":
            "environmentMaps/DeathStar_TractorBeam_4k.hdr",
          "Jabba's Throne Room": "environmentMaps/JabbaTHroneRoom_4k.hdr",
          "Maz's Castle": "environmentMaps/MazCastle_4k.hdr",
          "Mos Eisley Cantina": "environmentMaps/MosEisleyCanteen_4k.hdr",
          "Rebel Base": "environmentMaps/RebelBase_4k.hdr",
        },
      },
    }),
    calibration: folder({
      resetCenter: button(() => {
        resetCenter();
      }),
    }),
  });

  return (
    <div className="relative h-screen w-full">
      <Canvas
        shadows
        camera={{ position: [0, 0.25, 2], near: 0.1, far: 1000 }}
        gl={{ toneMapping: mode, toneMappingExposure: exposure }}
      >
        <OrbitControls enabled={!isDragging} />
        <Environment files={files} background />
        <Light />
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
      </Canvas>
    </div>
  );
}
