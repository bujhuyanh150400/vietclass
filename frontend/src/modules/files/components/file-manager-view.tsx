"use client";

import { Settings } from "lucide-react";

import { DataTablePagination, type DataTableState } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import type { PageMeta } from "@/lib/api/contracts";

import type { FilePondProcess } from "./filepond-input";
import { FileList } from "./file-list";
import { FileListToolbar } from "./file-list-toolbar";
import { FileUploadPanel } from "./file-upload-panel";
import { FileUsageMeter } from "./file-usage-meter";
import type { FileActionDialogState } from "./file-action-dialogs";
import type { FileCategory, FileOwnerOption, FileUsage, ManagedFile } from "../types/files";

/** The fully resolved file manager screen props; data and events remain owned by its container. */
export type FileManagerViewProps = {
  state: DataTableState<ManagedFile>;
  meta: PageMeta;
  search: string;
  category: FileCategory | null;
  trash: "active" | "trashed";
  ownerUserId: number | null;
  owners: FileOwnerOption[];
  isAdmin: boolean;
  usage: FileUsage | undefined;
  canUpload: boolean;
  uploadDisabledReason?: string;
  processUpload: FilePondProcess;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: FileCategory | null) => void;
  onTrashChange: (value: "active" | "trashed") => void;
  onOwnerChange: (value: number | null) => void;
  onPageChange: (page: number) => void;
  onPreview: (file: ManagedFile) => void;
  onAction: (kind: NonNullable<FileActionDialogState>["kind"], file: ManagedFile) => void;
  onOpenQuota: () => void;
};

/** Assembles the responsive, purely presentational file manager screen. */
export function FileManagerView({ state, meta, search, category, trash, ownerUserId, owners, isAdmin, usage, canUpload, uploadDisabledReason, processUpload, onSearchChange, onCategoryChange, onTrashChange, onOwnerChange, onPageChange, onPreview, onAction, onOpenQuota }: FileManagerViewProps) {
  return <div className="grid gap-6 overflow-x-hidden"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight">Tệp</h1><p className="text-sm text-muted-foreground">Thư viện tệp riêng tư của bạn.</p></div>{isAdmin ? <Button type="button" variant="outline" onClick={onOpenQuota}><Settings aria-hidden="true" />Hạn mức</Button> : null}</div><FileUploadPanel canUpload={canUpload} disabledReason={uploadDisabledReason} process={processUpload} />{usage ? <FileUsageMeter usage={usage} /> : null}<FileListToolbar search={search} category={category} trash={trash} owners={owners} ownerUserId={ownerUserId} isAdmin={isAdmin} onSearchChange={onSearchChange} onCategoryChange={onCategoryChange} onTrashChange={onTrashChange} onOwnerChange={onOwnerChange} /><FileList state={state} onPreview={onPreview} onAction={onAction} /><DataTablePagination meta={meta} onPageChange={onPageChange} /></div>;
}
