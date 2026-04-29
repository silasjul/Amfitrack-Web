"use client";

import { Upload } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from "@/components/ui/file-upload";

interface ImportFileUploadProps {
  accept?: string;
  onFileAccepted?: (file: File) => void;
}

export default function ImportFileUpload({
  accept = ".csv",
  onFileAccepted,
}: ImportFileUploadProps) {
  const [files, setFiles] = React.useState<File[]>([]);

  const handleValueChange = React.useCallback(
    (next: File[]) => {
      setFiles(next);
      if (next.length > 0 && onFileAccepted) {
        onFileAccepted(next[0]);
      }
    },
    [onFileAccepted],
  );

  const onFileReject = React.useCallback((file: File, message: string) => {
    toast(message, {
      description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}" has been rejected`,
    });
  }, []);

  return (
    <FileUpload
      maxFiles={1}
      maxSize={1 * 1024 * 1024}
      accept={accept}
      className="w-full flex-1"
      value={files}
      onValueChange={handleValueChange}
      onFileReject={onFileReject}
    >
      <FileUploadDropzone>
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center justify-center rounded-full border p-2.5">
            <Upload className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Drag & drop config here</p>
          <p className="text-xs text-muted-foreground">
            Or click to browse (max 1 file, up to 1MB, .csv only)
          </p>
        </div>
        <FileUploadTrigger asChild>
          <Button variant="outline" size="sm" className="mt-2 w-fit">
            Browse files
          </Button>
        </FileUploadTrigger>
      </FileUploadDropzone>
    </FileUpload>
  );
}
