"use client";

import { Download, Eye, MoreHorizontal, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { DataTable, EmptyState, type DataTableColumn, type DataTableState } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { fileContentUrl } from "../api";
import type { ManagedFile } from "../types/files";
import { formatFileSize } from "./file-usage-meter";

/** Derives the conservative lifecycle affordances from the resource's safe metadata. */
function fileActions(file: ManagedFile) {
  return { canTrash: file.trashed_at === null && !file.is_linked, canRestore: file.trashed_at !== null, canDeletePermanently: file.trashed_at !== null && !file.is_linked, canPreview: file.category === "image" || file.category === "pdf" };
}

/** Renders one file's action menu with inaccessible lifecycle actions omitted. */
function FileMenu({ file, onPreview, onAction }: { file: ManagedFile; onPreview: (file: ManagedFile) => void; onAction: (kind: "rename" | "trash" | "restore" | "permanent", file: ManagedFile) => void }) {
  const actions = fileActions(file);
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Thao tác với ${file.display_name}`}><MoreHorizontal aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
    {actions.canPreview ? <DropdownMenuItem onSelect={() => onPreview(file)}><Eye aria-hidden="true" />Xem trước</DropdownMenuItem> : null}
    <DropdownMenuItem asChild><a href={fileContentUrl(file.id, true)}><Download aria-hidden="true" />Tải xuống</a></DropdownMenuItem>
    {file.trashed_at === null ? <DropdownMenuItem onSelect={() => onAction("rename", file)}><Pencil aria-hidden="true" />Đổi tên</DropdownMenuItem> : null}
    {actions.canTrash ? <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={() => onAction("trash", file)}><Trash2 aria-hidden="true" />Chuyển vào thùng rác</DropdownMenuItem></> : null}
    {actions.canRestore ? <DropdownMenuItem onSelect={() => onAction("restore", file)}><RotateCcw aria-hidden="true" />Khôi phục</DropdownMenuItem> : null}
    {actions.canDeletePermanently ? <DropdownMenuItem variant="destructive" onSelect={() => onAction("permanent", file)}><Trash2 aria-hidden="true" />Xóa vĩnh viễn</DropdownMenuItem> : null}
  </DropdownMenuContent></DropdownMenu>;
}

/** Renders the library as a desktop table and touch-friendly compact mobile cards. */
export function FileList({ state, onPreview, onAction }: { state: DataTableState<ManagedFile>; onPreview: (file: ManagedFile) => void; onAction: (kind: "rename" | "trash" | "restore" | "permanent", file: ManagedFile) => void }) {
  const columns: DataTableColumn<ManagedFile>[] = [
    { key: "name", header: "Tệp", cell: (file) => <div className="grid min-w-0 gap-1"><span className="truncate font-medium">{file.display_name}</span><span className="text-xs text-muted-foreground">{file.original_name}</span></div> },
    { key: "category", header: "Loại", className: "w-32", cell: (file) => <Badge variant="outline">{file.category}</Badge> },
    { key: "size", header: "Dung lượng", className: "w-32", hideOnMobile: true, cell: (file) => formatFileSize(file.size_bytes) },
    { key: "owner", header: "Chủ sở hữu", hideOnMobile: true, cell: (file) => file.owner.display_name },
    { key: "usage", header: "Sử dụng", className: "w-28", hideOnMobile: true, cell: (file) => file.is_linked ? <Badge title="Tệp đang được dùng nên không thể xóa">Đang dùng</Badge> : "—" },
    { key: "actions", header: <span className="sr-only">Thao tác</span>, className: "w-12", cell: (file) => <FileMenu file={file} onPreview={onPreview} onAction={onAction} /> },
  ];

  return <><div className="hidden md:block"><DataTable columns={columns} state={state} rowKey={(file) => file.id} /></div><div className="grid gap-3 md:hidden"><MobileFileList state={state} onPreview={onPreview} onAction={onAction} /></div></>;
}

/** Renders the narrow-screen equivalent of the file table without horizontal scrolling. */
function MobileFileList({ state, onPreview, onAction }: { state: DataTableState<ManagedFile>; onPreview: (file: ManagedFile) => void; onAction: (kind: "rename" | "trash" | "restore" | "permanent", file: ManagedFile) => void }) {
  if (state.kind === "loading") return <>{[0, 1, 2].map((index) => <Card key={index}><CardContent className="grid gap-3"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>)}</>;
  if (state.kind === "error") return <Card><CardContent><EmptyState title={state.message} action={state.onRetry ? <Button type="button" variant="outline" onClick={state.onRetry}>Thử lại</Button> : undefined} /></CardContent></Card>;
  if (state.kind === "empty") return <Card><CardContent><EmptyState title={state.message} description={state.description} action={state.action} /></CardContent></Card>;
  return <>{state.rows.map((file) => <Card key={file.id}><CardContent className="grid gap-3"><div className="flex min-w-0 items-start justify-between gap-2"><div className="grid min-w-0 gap-1"><span className="truncate font-medium">{file.display_name}</span><span className="truncate text-xs text-muted-foreground">{file.original_name}</span></div><FileMenu file={file} onPreview={onPreview} onAction={onAction} /></div><div className="flex flex-wrap gap-2"><Badge variant="outline">{file.category}</Badge>{file.is_linked ? <Badge title="Tệp đang được dùng nên không thể xóa">Đang dùng</Badge> : null}<span className="text-sm text-muted-foreground">{formatFileSize(file.size_bytes)}</span></div>{file.is_linked ? <p className="text-sm text-muted-foreground">Tệp đang được sử dụng nên không thể chuyển vào thùng rác.</p> : null}</CardContent></Card>)}</>;
}
