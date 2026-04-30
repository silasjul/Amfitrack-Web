import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useDeviceStore } from "@/amfitrackSDK/src/store/useDeviceStore";

export default function DeviceCard({ txId }: { txId: number }) {
  const deviceMeta = useDeviceStore((s) => s.deviceMeta[txId]);

  const capitalizedName =
    deviceMeta?.kind.charAt(0).toUpperCase() + deviceMeta?.kind.slice(1);

  return (
    <Card className="w-full p-4">
      <CardContent className="p-0">
        <Collapsible className="rounded-md data-[state=open]:bg-muted">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="group w-full">
              {capitalizedName} {txId}
              <ChevronDown className="ml-auto group-data-[state=open]:rotate-180" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col items-start gap-2 p-2.5 pt-0 text-sm">
            <div>
              This panel can be expanded or collapsed to reveal additional
              content.
            </div>
            <Button size="xs">Learn More</Button>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
