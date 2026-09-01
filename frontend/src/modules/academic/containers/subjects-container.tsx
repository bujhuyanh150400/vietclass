"use client";

import { useState } from "react";

import { useToast } from "@/components/shared/toast-provider";
import { isApiClientError } from "@/lib/api/api-client-error";

import { ConfirmActionDialog } from "../components/confirm-action-dialog";
import { SubjectsView } from "../components/subjects-view";
import { useDeleteSubject, useSetSubjectActive, useSubjectList } from "../hooks/use-subjects";
import type { Subject } from "../types/academic";

/** Which confirmation, if any, is open and for which subject. */
type PendingAction =
  | { kind: "none" }
  | { kind: "toggle"; subject: Subject }
  | { kind: "delete"; subject: Subject };

/**
 * Coordinates the subject list: the paged query behind it and the two actions that
 * need confirming before they run.
 *
 * Locking and deleting both carry a rule about the classes using the subject, so
 * either can be refused. The confirmation stays open when that happens and shows
 * the reason, rather than closing and leaving the reader to guess.
 */
export function SubjectsContainer() {
  const list = useSubjectList();
  const toggleActive = useSetSubjectActive();
  const remove = useDeleteSubject();
  const showToast = useToast();

  const [pending, setPending] = useState<PendingAction>({ kind: "none" });
  const [actionError, setActionError] = useState<string | null>(null);

  /** Opens a confirmation, clearing any refusal left from the previous one. */
  function open(action: PendingAction) {
    setActionError(null);
    setPending(action);
  }

  /** Closes the confirmation without acting. */
  function close() {
    setActionError(null);
    setPending({ kind: "none" });
  }

  /** Reports why the API refused, keeping the confirmation open. */
  function reportFailure(error: unknown) {
    setActionError(
      isApiClientError(error) ? error.message : "Không thực hiện được thao tác này.",
    );
  }

  /** Runs the confirmed action and closes only once the API accepts it. */
  async function confirm() {
    if (pending.kind === "none") {
      return;
    }

    try {
      if (pending.kind === "toggle") {
        await toggleActive.mutateAsync({
          id: pending.subject.id,
          isActive: !pending.subject.is_active,
        });
      } else {
        await remove.mutateAsync(pending.subject.id);
      }

      showToast({ variant: "success", title: successMessage(pending) });
      close();
    } catch (error) {
      reportFailure(error);
    }
  }

  const subject = pending.kind === "none" ? null : pending.subject;
  const locking = pending.kind === "toggle" && subject?.is_active === true;

  return (
    <>
      <SubjectsView
        state={list.state}
        meta={list.meta}
        search={list.query.q}
        onSearchChange={list.query.setSearch}
        onPageChange={list.query.setPage}
        onToggleActive={(target) => open({ kind: "toggle", subject: target })}
        onDelete={(target) => open({ kind: "delete", subject: target })}
      />

      <ConfirmActionDialog
        open={pending.kind !== "none"}
        onOpenChange={(next) => (next ? undefined : close())}
        title={confirmTitle(pending, locking)}
        description={confirmDescription(pending, locking)}
        confirmLabel={confirmLabel(pending, locking)}
        destructive={pending.kind === "delete"}
        errorMessage={actionError}
        isPending={toggleActive.isPending || remove.isPending}
        onConfirm={() => void confirm()}
      />
    </>
  );
}

/**
 * States what the confirmed action just did, for the toast that reports it.
 *
 * The subject is read as it was before the call, so a lock that has already been
 * applied is still described as locking rather than as the state it produced.
 */
function successMessage(pending: PendingAction): string {
  if (pending.kind === "none") {
    return "";
  }

  const name = pending.subject.name;

  if (pending.kind === "delete") {
    return `Đã xóa môn học "${name}".`;
  }

  return pending.subject.is_active
    ? `Đã khóa môn học "${name}".`
    : `Đã mở lại môn học "${name}".`;
}

/** Names the decision being confirmed. */
function confirmTitle(pending: PendingAction, locking: boolean): string {
  if (pending.kind === "delete") {
    return "Xóa môn học?";
  }

  return locking ? "Khóa môn học?" : "Mở lại môn học?";
}

/** Explains what confirming will do. */
function confirmDescription(pending: PendingAction, locking: boolean): string {
  if (pending.kind === "none") {
    return "";
  }

  const name = pending.subject.name;

  if (pending.kind === "delete") {
    return `Môn học "${name}" sẽ bị xóa vĩnh viễn. Chỉ xóa được khi không còn lớp nào dùng môn này.`;
  }

  return locking
    ? `Môn học "${name}" sẽ không chọn được khi mở lớp mới. Các lớp đang chạy không bị ảnh hưởng.`
    : `Môn học "${name}" sẽ chọn được trở lại khi mở lớp mới.`;
}

/** Labels the confirming control. */
function confirmLabel(pending: PendingAction, locking: boolean): string {
  if (pending.kind === "delete") {
    return "Xóa";
  }

  return locking ? "Khóa" : "Mở";
}
