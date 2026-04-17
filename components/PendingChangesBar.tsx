"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useConfigurations } from "@/hooks/useConfigurations";
import { useSaveConfigurations } from "@/hooks/useSaveConfigurations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";

export const PENDING_BAR_ATTR = "data-pending-changes-bar";

export default function PendingChangesBar() {
  const { configurations, clearConfigurations } = useConfigurations();
  const { save, saving } = useSaveConfigurations();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && !saving && configurations.length > 0) {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save, saving, configurations.length]);

  const count = configurations.length;
  if (count === 0 || !mounted) return null;

  return createPortal(
    <div
      {...{ [PENDING_BAR_ATTR]: "" }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <div className="flex items-center gap-3 rounded-xl border border-border bg-background/80 backdrop-blur-lg shadow-lg px-4 py-2.5">
        <Badge variant="secondary">{count}</Badge>
        <span className="text-sm text-muted-foreground">
          unsaved {count === 1 ? "change" : "changes"}
        </span>

        <div className="flex items-center gap-1.5 ml-1">
          <Button
            variant="outline"
            size="sm"
            onClick={clearConfigurations}
            disabled={saving}
          >
            <X data-icon="inline-start" />
            Discard
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving && (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            )}
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
