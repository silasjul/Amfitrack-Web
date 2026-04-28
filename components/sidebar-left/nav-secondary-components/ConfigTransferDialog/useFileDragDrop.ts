"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

export function useFileDragDrop(open: boolean) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleFileDrop = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Invalid file", {
        description: "Please drop a .csv configuration file.",
      });
      return;
    }
    toast.info(`Received "${file.name}"`, {
      description: "CSV import is not yet implemented.",
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    const hasFiles = (e: DragEvent) =>
      e.dataTransfer?.types.includes("Files") ?? false;

    const onDragEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragCounter.current += 1;
      if (dragCounter.current === 1) setIsDragging(true);
    };

    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current === 0) setIsDragging(false);
    };

    const onDragOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);

    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
      dragCounter.current = 0;
      setIsDragging(false);
    };
  }, [open]);

  const onDialogDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) handleFileDrop(file);
    },
    [handleFileDrop],
  );

  return { isDragging, onDialogDrop };
}
