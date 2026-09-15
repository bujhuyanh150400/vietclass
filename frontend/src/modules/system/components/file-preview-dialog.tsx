"use client";

/* eslint-disable @next/next/no-img-element -- private API redirect URLs cannot be configured as Next image sources. */

import { Download, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { fileContentUrl } from "../api";
import type { ManagedFile } from "../types/files";

/** Opens an authorized image or PDF endpoint without exposing a storage URL. */
export function FilePreviewDialog({ file, onOpenChange }: { file: ManagedFile | null; onOpenChange: (open: boolean) => void }) {
  const canPreview = file?.category === "image" || file?.category === "pdf";

  return (
    <Dialog open={file !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle>{file?.display_name}</DialogTitle><DialogDescription>{file ? `${file.extension.toUpperCase()} · ${file.size_bytes.toLocaleString("vi-VN")} byte` : ""}</DialogDescription></DialogHeader>
        {file && canPreview ? (
          file.category === "image" ? <img src={fileContentUrl(file.id)} alt={file.display_name} className="max-h-[60svh] w-full rounded-md object-contain" /> : <iframe title={`Xem trước ${file.display_name}`} src={fileContentUrl(file.id)} className="h-[60svh] w-full rounded-md border" />
        ) : <p className="text-sm text-muted-foreground">Loại tệp này không hỗ trợ xem trước trong thư viện.</p>}
        {file ? <DialogFooter><Button asChild variant="outline"><a href={fileContentUrl(file.id)} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" />Mở tab mới</a></Button><Button asChild><a href={fileContentUrl(file.id, true)}><Download aria-hidden="true" />Tải xuống</a></Button></DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
