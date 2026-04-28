"use client";

import { Bluetooth, Usb, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAmfitrack } from "@/amfitrackSDK";

export default function Footer() {
  const { sdk } = useAmfitrack();

  return (
    <Card
      size="sm"
      className="border-sidebar-border bg-sidebar-accent shadow-sm"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-1 leading-none">
          Connect device
          <ChevronRight
            className="size-3.5 shrink-0 text-sidebar-foreground/80"
            aria-hidden
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0">
        <div className="flex gap-1">
          <Button
            className="flex-1 flex items-center gap-1 justify-center border-sidebar-border/90 bg-sidebar-accent/60 hover:bg-sidebar-accent/80"
            onClick={() => sdk?.requestConnectionViaUSB()}
            variant="outline"
            size="icon"
          >
            <Usb className="size-3.5 text-sidebar-foreground" />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-xs font-medium">USB</span>
            </span>
          </Button>
          <Button
            className="flex-1 flex items-center gap-1 justify-center border-sidebar-border/90 bg-sidebar-accent/60 hover:bg-sidebar-accent/80"
              onClick={() => sdk?.requestConnectionViaBLE()}
            variant="outline"
            size="icon"
          >
            <Bluetooth className="size-3.5 text-sidebar-foreground/80" />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-xs font-medium">Bluetooth</span>
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
