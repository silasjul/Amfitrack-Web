import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

export default function DropOverlay() {
  return (
    <Card className="border-dashed border-2 border-primary/70 absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-background/80">
      <div className="flex items-center gap-3">
        <Upload className="size-6 text-primary" />
        <div>
          <CardTitle>Drop CSV configuration to import</CardTitle>
          <CardDescription>Max 1 file, 1mb, .csv</CardDescription>
        </div>
      </div>
    </Card>
  );
}
