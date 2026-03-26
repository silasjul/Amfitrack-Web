import React from "react";
import { Button } from "@/components/ui/button";
import { useAmfitrack } from "@/hooks/useAmfitrack";

export default function Footer() {
  const { requestConnectionDevice } = useAmfitrack();

  return (
    <div className="h-full w-full flex flex-col pb-2">
      <Button
        className="mt-auto"
        variant="outline"
        onClick={requestConnectionDevice}
      >
        Connect New Device
      </Button>
    </div>
  );
}
