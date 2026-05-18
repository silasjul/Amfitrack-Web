"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Suspense } from "react";
import { Leva } from "leva";
import { XR } from "@react-three/xr";
import SceneManager from "@/components/scene-manager/SceneManager";
import VrUiRoot from "@/components/vr-ui/VrUiRoot";
import R3fLoader from "@/components/general/r3f-loader";
import { useLevaToggle } from "@/hooks/useLevaToggle";
import { xrStore } from "@/stores/xrStore";
import { AppSidebar as RightAppSidebar } from "@/components/viewer/sidebar-right/app-sidebar";
import {
  RightSidebarInset,
  RightSidebarProvider,
  RightSidebarTrigger,
} from "@/components/ui/sidebar-right";

const GL_PROPS = { toneMapping: THREE.ReinhardToneMapping };

export default function SceneHostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const levaHidden = useLevaToggle();

  return (
    <RightSidebarProvider>
      <RightSidebarInset className="min-w-0 overflow-hidden">
        <div className="absolute top-0 right-0 z-10 flex shrink-0 items-center gap-2 p-2">
          <RightSidebarTrigger className="bg-sidebar p-4 shadow-sidebar text-sidebar-foreground/50 transition-[width,height,padding] hover:text-sidebar-foreground" />
        </div>
        <div className="relative h-full w-full">
          <Leva
            hidden={levaHidden}
            theme={{ sizes: { rootWidth: "400px", controlWidth: "full" } }}
          />
          <R3fLoader />
          <Canvas shadows gl={GL_PROPS}>
            <XR store={xrStore}>
              <Suspense fallback={null}>
                <SceneManager />
                <VrUiRoot />
              </Suspense>
            </XR>
          </Canvas>
          {children}
        </div>
      </RightSidebarInset>
      <RightAppSidebar />
    </RightSidebarProvider>
  );
}
