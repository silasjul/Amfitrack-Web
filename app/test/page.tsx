"use client";

import React, { useEffect, useRef } from "react";
import { useAmfitrack } from "@/amfitrackSDK";

export default function Home() {
  const { sdk, isLoading } = useAmfitrack();

  return (
    <div className="flex-1 flex items-center justify-center">
      {isLoading ? "Loading..." : "Ready"}
    </div>
  );
}
