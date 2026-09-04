"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import type { DataTableState } from "@/components/shared/data-table";
import { useToast } from "@/components/shared/toast-provider";
import { isApiClientError } from "@/lib/api/api-client-error";
import type { PageMeta } from "@/lib/api/contracts";
import { useCurrentUser } from "@/modules/identity";

import { FileActionDialogs, type FileActionDialogState } from "../components/file-action-dialogs";
import { FileManagerView } from "../components/file-manager-view";
import { FilePreviewDialog } from "../components/file-preview-dialog";
import { FileQuotaDialog } from "../components/file-quota-dialog";
import { useFileList, useFileOwnerOptions, useFileQuotas, useFileUsage, usePermanentlyDeleteFile, useRenameFile, useRestoreFile, useTrashFile, useUpdateFileQuotas, useUploadFile, type FilePondProcess } from "..";
import type { FileCategory, ManagedFile } from "../types/files";

const FILE_CATEGORIES = ["image", "pdf", "document", "spreadsheet", "presentation", "text"] as const;
const EMPTY_META: PageMeta = { current_page: 1, per_page: 20, total: 0, last_page: 1 };

/** Safely turns an API failure into one client-safe sentence for a dialog or toast. */
function actionMessage(error: unknown): string {
  return isApiClientError(error) ? error.message : "Không thực hiện được thao tác này.";
}

/** Owns file-library URL state, data requests, mutations, upload transport, and dialog state. */
export function FileManagerContainer() {
  const [controls, setControls] = useQueryStates({
    search: parseAsString.withDefault(""),
    category: parseAsStringLiteral(FILE_CATEGORIES),
    trash: parseAsStringLiteral(["active", "trashed"] as const).withDefault("active"),
    owner_user_id: parseAsInteger,
    page: parseAsInteger.withDefault(1),
  }, { history: "replace", clearOnDefault: true });
  const currentUser = useCurrentUser(true);
  const user = currentUser.data;
  const isAdmin = user?.role === 0;
  const [ownerDefaulted, setOwnerDefaulted] = useState(false);
  const showToast = useToast();
  const [previewFile, setPreviewFile] = useState<ManagedFile | null>(null);
  const [dialog, setDialog] = useState<FileActionDialogState>(null);
  const [renameValue, setRenameValue] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin && user && !ownerDefaulted && controls.owner_user_id === null) {
      void setControls({ owner_user_id: user.id }).then(() => setOwnerDefaulted(true));
    }
  }, [controls.owner_user_id, isAdmin, ownerDefaulted, setControls, user]);

  const listParams = useMemo(() => ({
    search: controls.search || undefined,
    category: controls.category ?? undefined,
    trash: controls.trash,
    owner_user_id: isAdmin ? controls.owner_user_id ?? undefined : undefined,
    page: controls.page,
  }), [controls, isAdmin]);
  const list = useFileList(listParams);
  const ownerIsAll = isAdmin && controls.owner_user_id === null && ownerDefaulted;
  const owners = useFileOwnerOptions({}, isAdmin);
  const usage = useFileUsage(isAdmin && controls.owner_user_id !== null ? { owner_user_id: controls.owner_user_id } : {}, !ownerIsAll && user !== undefined);
  const quotas = useFileQuotas(isAdmin);
  const upload = useUploadFile();
  const rename = useRenameFile();
  const trash = useTrashFile();
  const restore = useRestoreFile();
  const permanentDelete = usePermanentlyDeleteFile();
  const updateQuotas = useUpdateFileQuotas();

  const state: DataTableState<ManagedFile> = list.data
    ? list.data.data.length === 0 ? { kind: "empty", message: "Không tìm thấy tệp nào khớp." } : { kind: "content", rows: list.data.data }
    : list.isPending ? { kind: "loading" }
    : { kind: "error", message: actionMessage(list.error), onRetry: () => { void list.refetch(); } };

  /** Updates one filter and returns the visible library to its first page. */
  const changeControls = useCallback((next: { search?: string; category?: FileCategory | null; trash?: "active" | "trashed"; owner_user_id?: number | null }) => {
    void setControls({ ...next, page: 1 });
  }, [setControls]);

  /** Connects one FilePond item to one cancellable Laravel multipart upload. */
  const processUpload: FilePondProcess = useCallback((file, handlers) => {
    const controller = new AbortController();
    void upload.mutateAsync({ request: { file, owner_user_id: isAdmin ? controls.owner_user_id ?? undefined : undefined }, onProgress: handlers.progress, signal: controller.signal })
      .then((result) => { handlers.load(String(result.id)); showToast({ title: `Đã tải ${result.display_name} lên.` }); })
      .catch((error: unknown) => handlers.error(actionMessage(error)));
    return { abort: () => { controller.abort(); handlers.abort(); } };
  }, [controls.owner_user_id, isAdmin, showToast, upload]);

  /** Opens one lifecycle dialog and seeds its rename field when appropriate. */
  function openAction(kind: NonNullable<FileActionDialogState>["kind"], file: ManagedFile) {
    setActionError(null);
    setRenameValue(kind === "rename" ? file.display_name : "");
    setDialog({ kind, file });
  }

  /** Executes the selected lifecycle change and retains its dialog on a refused request. */
  async function confirmAction() {
    if (!dialog) return;
    setActionError(null);
    try {
      if (dialog.kind === "rename") await rename.mutateAsync({ id: dialog.file.id, body: { display_name: renameValue.trim() } });
      if (dialog.kind === "trash") await trash.mutateAsync(dialog.file.id);
      if (dialog.kind === "restore") await restore.mutateAsync(dialog.file.id);
      if (dialog.kind === "permanent") await permanentDelete.mutateAsync(dialog.file.id);
      showToast({ title: "Đã cập nhật tệp." });
      setDialog(null);
    } catch (error) { setActionError(actionMessage(error)); }
  }

  /** Saves all administrator quota fields and closes only after the API accepts them. */
  async function saveQuotas(nextQuotas: Parameters<typeof updateQuotas.mutateAsync>[0]["quotas"]) {
    setQuotaError(null);
    try { await updateQuotas.mutateAsync({ quotas: nextQuotas }); showToast({ title: "Đã cập nhật hạn mức." }); setQuotaOpen(false); } catch (error) { setQuotaError(actionMessage(error)); }
  }

  const actionPending = rename.isPending || trash.isPending || restore.isPending || permanentDelete.isPending;
  const canUpload = user !== undefined && !ownerIsAll;
  const uploadDisabledReason = user === undefined ? "Đang xác minh quyền tải tệp." : ownerIsAll ? "Chọn một chủ sở hữu để tải tệp lên." : undefined;

  return <>
    <FileManagerView state={state} meta={list.data?.meta ?? EMPTY_META} search={controls.search} category={controls.category} trash={controls.trash} ownerUserId={controls.owner_user_id} owners={owners.data ?? []} isAdmin={isAdmin} usage={usage.data} canUpload={canUpload} uploadDisabledReason={uploadDisabledReason} processUpload={processUpload} onSearchChange={(search) => changeControls({ search })} onCategoryChange={(category) => changeControls({ category })} onTrashChange={(trashValue) => changeControls({ trash: trashValue })} onOwnerChange={(owner_user_id) => changeControls({ owner_user_id })} onPageChange={(page) => { void setControls({ page }); }} onPreview={setPreviewFile} onAction={openAction} onOpenQuota={() => { setQuotaError(null); setQuotaOpen(true); }} />
    <FilePreviewDialog file={previewFile} onOpenChange={(open) => { if (!open) setPreviewFile(null); }} />
    <FileActionDialogs dialog={dialog} renameValue={renameValue} errorMessage={actionError} isPending={actionPending} onOpenChange={(open) => { if (!open) setDialog(null); }} onRenameValueChange={setRenameValue} onConfirm={() => { void confirmAction(); }} />
    {isAdmin ? <FileQuotaDialog open={quotaOpen} quotas={quotas.data} isPending={updateQuotas.isPending} errorMessage={quotaError} onOpenChange={setQuotaOpen} onSubmit={(nextQuotas) => { void saveQuotas(nextQuotas); }} /> : null}
  </>;
}
