"use client";

import React, { useEffect, useRef } from "react";
import { useAmfitrack } from "@/amfitrackSDK";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { sdk, isLoading } = useAmfitrack();

  return (
    <div className="flex-1 flex items-center justify-center">
      {isLoading ? (
        "Loading..."
      ) : (
        <Button onClick={() => sdk?.requestConnectionViaUSB()}>
          Request Connection
        </Button>
      )}
    </div>
  );
}
