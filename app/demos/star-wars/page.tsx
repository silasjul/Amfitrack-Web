"use client";

import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  PivotControls,
  Center,
} from "@react-three/drei";
import { useControls, folder, button, Leva } from "leva";
import Lightsaber from "@/components/starwars/lightsaber/lightsaber";
import Light from "@/components/starwars/light";
import { useRef, useState } from "react";
import { useDeviceStore } from "@/amfitrackSDK";

const POSITION_SCALE = 0.01;

function SensorSync({
  modelRef,
  metalDistortionRef,
  centerOffsetRef,
}: {
  modelRef: React.RefObject<THREE.Group | null>;
  metalDistortionRef: React.RefObject<number>;
  centerOffsetRef: React.RefObject<THREE.Vector3>;
}) {
  useFrame(() => {
    const emfData = useDeviceStore.getState().emfImuFrameId;
    const firstKey = Object.keys(emfData)[0];
    if (!firstKey || !modelRef.current) return;
    const first = emfData[Number(firstKey)];

    const pos = new THREE.Vector3(
      -first.position.y * POSITION_SCALE,
      first.position.z * POSITION_SCALE,
      -first.position.x * POSITION_SCALE,
    );

    modelRef.current.position.copy(pos).sub(centerOffsetRef.current);
    modelRef.current.quaternion
      .set(
        -first.quaternion.y,
        first.quaternion.z,
        -first.quaternion.x,
        first.quaternion.w,
      )
      .normalize();
    metalDistortionRef.current = first.metalDistortion / 255;
  });

  return null;
}

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const modelRef = useRef<THREE.Group>(null);
  const metalDistortionRef = useRef<number>(0);
  const centerOffsetRef = useRef(new THREE.Vector3());

  const resetCenter = () => {
    const emfData = useDeviceStore.getState().emfImuFrameId;
    const firstKey = Object.keys(emfData)[0];
    if (firstKey) {
      const first = emfData[Number(firstKey)];
      centerOffsetRef.current.set(
        -first.position.y * POSITION_SCALE,
        first.position.z * POSITION_SCALE,
        -first.position.x * POSITION_SCALE,
      );
    }
  };

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
      resetCenter: button(() => {
        resetCenter();
      }),
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
        <SensorSync
          modelRef={modelRef}
          metalDistortionRef={metalDistortionRef}
          centerOffsetRef={centerOffsetRef}
        />
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
