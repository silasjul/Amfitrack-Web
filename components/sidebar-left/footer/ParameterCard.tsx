import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

export default function ParameterCard({
  param,
}: {
  param: { name: string; uid: number; value: number | boolean | string };
}) {
  const value = param.value;
  const formattedValue =
    typeof value === "number"
      ? Number.isInteger(value)
        ? value.toString()
        : value.toFixed(4)
      : typeof value === "string"
        ? value
        : null;

  return (
    <Card size="sm" className="gap-1 py-2 bg-sidebar-accent">
      <CardHeader className="px-3 pb-0">
        <CardTitle className="font-roboto-mono">{param.name}</CardTitle>
      </CardHeader>
      <CardContent className="px-3">
        {typeof value === "boolean" ? (
          <div className="flex items-center">
            <Switch checked={value} aria-label={param.name} />
          </div>
        ) : (
          <Input
            readOnly
            value={formattedValue ?? ""}
            aria-label={param.name}
            className="font-mono text-sm font-medium h-8 px-2 opacity-80"
          />
        )}
        <span className="text-[10px] text-muted-foreground/60">
          {param.uid.toString(16).toUpperCase().padStart(8, "0")}
        </span>
      </CardContent>
    </Card>
  );
}
