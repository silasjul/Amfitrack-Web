"use client";

import React, { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Configuration } from "@/amfitrackSDK";
import { usePendingConfigStore } from "@/stores/usePendingConfigStore";
import ParameterCard from "./ParameterCard";

export default function DeviceSettingsDialog({
  open,
  onOpenChange,
  txId,
  deviceName,
  configuration,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  txId: number;
  deviceName: string;
  configuration: Configuration[];
  loading?: boolean;
}) {
  const defaultTab = configuration[0]?.name ?? "";
  const updatePending = usePendingConfigStore((s) => s.updatePending);
  const configurationTooltips = usePendingConfigStore(
    (s) => s.configurationTooltips,
  );

  const handleValueChange = useCallback(
    (
      categoryName: string,
      uid: number,
      parameterName: string,
      currentValue: number | boolean | string,
      newValue: number | boolean | string,
    ) => {
      updatePending({
        txId,
        paramUid: uid,
        categoryName,
        parameterName,
        currentValue,
        valueToPush: newValue,
      });
    },
    [txId, updatePending],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[75vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{deviceName} Settings</DialogTitle>
          <DialogDescription>
            Configuration parameters for the {deviceName.toLowerCase()} device.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <LoadingSkeleton />
        ) : configuration.length === 0 ? (
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
                    {category.parameters.map((param) => (
                      <ParameterCard
                        key={`${param.uid}-${param.value}`}
                        param={param}
                        txId={txId}
                        configurationTooltip={
                          configurationTooltips[category.name]?.[param.name] ??
                          undefined
                        }
                        onValueChange={(
                          uid,
                          parameterName,
                          currentValue,
                          newValue,
                        ) =>
                          handleValueChange(
                            category.name,
                            uid,
                            parameterName,
                            currentValue,
                            newValue,
                          )
                        }
                      />
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

function LoadingSkeleton() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4">
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
