"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAmfitrack } from "@/hooks/useAmfitrack";
import { cn } from "@/lib/utils";
import { Unplug, Plus, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Configuration } from "@/amfitrackWebSDK/Configurator";
import ParameterCard from "./ParameterCard";

export default function DeviceSettingsDialog({
  open,
  onOpenChange,
  deviceName,
  configuration,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceName: string;
  configuration: Configuration[];
}) {
  const defaultTab = configuration[0]?.name ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[75vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{deviceName} Settings</DialogTitle>
          <DialogDescription>
            Configuration parameters for the {deviceName.toLowerCase()} device.
          </DialogDescription>
        </DialogHeader>

        {configuration.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No configuration available.
          </p>
        ) : (
          <Tabs
            defaultValue={defaultTab}
            className="flex-1 min-h-0 flex flex-col"
          >
            <TabsList className="w-full shrink-0 h-10">
              {configuration.map((category) => (
                <TabsTrigger key={category.name} value={category.name}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <ScrollArea type="always" className="flex-1 min-h-0">
              {configuration.map((category) => (
                <TabsContent
                  key={category.name}
                  value={category.name}
                  className="mt-0 p-1"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 pt-1">
                    {category.parameters.map((param, idx) => (
                      <ParameterCard key={param.name + idx} param={param} />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
