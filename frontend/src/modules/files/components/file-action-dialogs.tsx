"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { ManagedFile } from "../types/files";

/** The single file lifecycle dialog the container has currently selected. */
export type FileActionDialogState = { kind: "rename" | "trash" | "restore" | "permanent"; file: ManagedFile } | null;

/** Renders rename and lifecycle confirmation dialogs while leaving effects to its owner. */
export function FileActionDialogs({
  dialog,
  renameValue,
  errorMessage,
  isPending,
  onOpenChange,
  onRenameValueChange,
  onConfirm,
}: {
  dialog: FileActionDialogState;
  renameValue: string;
  errorMessage: string | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onRenameValueChange: (value: string) => void;
  onConfirm: () => void;
}) {
  if (dialog?.kind === "rename") {
    return (
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader><DialogTitle>Đổi tên tệp</DialogTitle><DialogDescription>Tên mới chỉ thay đổi nhãn hiển thị, không đổi nội dung tệp.</DialogDescription></DialogHeader>
          <div className="grid gap-2"><Label htmlFor="file-display-name">Tên hiển thị</Label><Input id="file-display-name" value={renameValue} onChange={(event) => onRenameValueChange(event.target.value)} disabled={isPending} autoFocus /></div>
          {errorMessage ? <Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert> : null}
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Hủy</Button><Button type="button" onClick={onConfirm} disabled={isPending || renameValue.trim() === ""}>{isPending ? "Đang lưu…" : "Lưu tên"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const text = dialog === null ? null : {
    trash: { title: "Chuyển vào thùng rác?", description: `${dialog.file.display_name} sẽ được giữ trong 30 ngày trước khi xóa vĩnh viễn.`, label: "Chuyển vào thùng rác", destructive: true },
    restore: { title: "Khôi phục tệp?", description: `${dialog.file.display_name} sẽ xuất hiện lại trong thư viện.`, label: "Khôi phục", destructive: false },
    permanent: { title: "Xóa vĩnh viễn?", description: `${dialog.file.display_name} và nội dung của tệp sẽ không thể khôi phục.`, label: "Xóa vĩnh viễn", destructive: true },
  }[dialog.kind];

  return <ConfirmActionDialog open={dialog !== null} onOpenChange={onOpenChange} title={text?.title ?? ""} description={text?.description ?? ""} confirmLabel={text?.label ?? ""} destructive={text?.destructive} errorMessage={errorMessage} isPending={isPending} onConfirm={onConfirm} />;
}
