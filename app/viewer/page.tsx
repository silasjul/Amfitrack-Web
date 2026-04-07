"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PivotControls,
  Center,
} from "@react-three/drei";
import { useControls, folder, button, Leva } from "leva";
import Lightsaber from "@/components/minigames/starwars/lightsaber/lightsaber";
import Light from "@/components/minigames/starwars/light";
import { useEffect, useState } from "react";
import { useAmfitrack } from "@/hooks/useAmfitrack";

export default function Home() {
  return (
    <div className="relative h-full w-full">
      <Leva collapsed />
      <Canvas
        shadows
        camera={{ position: [0, 0.25, 2], near: 0.1, far: 1000 }}
      >
        <OrbitControls />
        <Light />
      </Canvas>
    </div>
  );
}
