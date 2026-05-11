"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExportTab from "./ExportTab";
import ImportTab from "./ImportTab";

export default function ConfigTransferDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-5xl min-h-[40vh] flex flex-col overflow-hidden"
      >
        <Header />
        <Tabs
          defaultValue="Export"
          className="flex-1 min-h-0 flex flex-col gap-4"
        >
          <TabsList className="w-full shrink-0 h-10">
            <TabsTrigger value="Export">Export</TabsTrigger>
            <TabsTrigger value="Import">Import</TabsTrigger>
          </TabsList>
          <ExportTab />
          <ImportTab />
        </Tabs>
        {/* {isDragging && <DropOverlay />} */}
      </DialogContent>
    </Dialog>
  );
}

function Header() {
  return (
    <DialogHeader>
      <DialogTitle>Config Transfer</DialogTitle>
      <DialogDescription>
        Export or import device configurations from Amfitrack products.
      </DialogDescription>
    </DialogHeader>
  );
}
