"use client";

import { useAmfitrack } from "@/hooks/useAmfitrack";
import { Button } from "@/components/ui/button";

export default function WebSdkPage() {
  const {
    status,
    hubRef,
    startReading,
    stopReading,
    requestConnectionDevice,
    metalDistortion,
  } = useAmfitrack();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Button onClick={() => requestConnectionDevice()}>
        Request Connection
      </Button>
      <Button onClick={() => startReading(hubRef.current)}>
        Start Reading
      </Button>
      <Button onClick={() => stopReading()}>Stop Reading</Button>
    </div>
  );
}
