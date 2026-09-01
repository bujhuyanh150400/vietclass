"use client";

import { useState } from "react";

import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { useWriteAccess } from "@/hooks/use-write-access";
import { isApiClientError } from "@/lib/api/api-client-error";

import { ClassScheduleView } from "../components/class-schedule-view";
import { useDeleteScheduleTemplate, useScheduleTemplateList } from "../hooks/use-schedule-templates";
import type { ScheduleTemplate } from "../types/schedule";
import { DAY_OF_WEEK_LABELS, formatTimeRange } from "../utils/labels";
import {
  CloseScheduleTemplateDialog,
  ScheduleTemplateTeachersDialog,
} from "./schedule-template-dialogs";
import { ScheduleTemplateFormDialog } from "./schedule-template-form-container";

/** Which schedule dialog, if any, is open and for which slot. */
type OpenDialog =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "revise"; template: ScheduleTemplate }
  | { kind: "teachers"; template: ScheduleTemplate }
  | { kind: "close"; template: ScheduleTemplate }
  | { kind: "delete"; template: ScheduleTemplate };

/**
 * Coordinates everything that can be done to one class's fixed schedules: reading
 * them, opening a new weekly slot, revising one, replacing its teachers, closing
 * it, and removing one that has not started yet.
 *
 * A fixed schedule has no list screen of its own — it means nothing apart from the
 * class it belongs to — so this renders inside the class detail page and every
 * write happens in a dialog over that page.
 *
 * The room and teacher clashes the API refuses arrive as `409` with a message that
 * already names the class occupying the slot, so the server's own wording is shown
 * rather than replaced: only the API knows which class is in the way.
 *
 * Reading is wider than writing here — a teacher may read this list, and only an
 * administrator may change it — so this is the one place the role is consulted.
 * Without write access the view renders no control that opens a dialog, which is
 * what makes the dialogs below unreachable for that role; the API refuses those
 * writes regardless, so this only removes a dead end.
 */
export function ClassScheduleContainer({ classId }: { classId: number }) {
  const list = useScheduleTemplateList(classId);
  const remove = useDeleteScheduleTemplate();
  const canWrite = useWriteAccess();

  const [dialog, setDialog] = useState<OpenDialog>({ kind: "none" });
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /** Closes whichever dialog is open and drops any refusal it was showing. */
  function close() {
    setDeleteError(null);
    setDialog({ kind: "none" });
  }

  /**
   * Removes one slot, keeping the confirmation open when the API refuses so its
   * reason — a slot already in effect, or lessons written under it — can be read.
   */
  async function confirmDelete() {
    if (dialog.kind !== "delete") {
      return;
    }

    try {
      await remove.mutateAsync(dialog.template.id);
      close();
    } catch (error) {
      setDeleteError(
        isApiClientError(error) ? error.message : "Không xóa được lịch cố định này.",
      );
    }
  }

  return (
    <>
      <ClassScheduleView
        state={list.state}
        canWrite={canWrite}
        onAdd={() => setDialog({ kind: "create" })}
        onRevise={(template) => setDialog({ kind: "revise", template })}
        onChangeTeachers={(template) => setDialog({ kind: "teachers", template })}
        onClose={(template) => setDialog({ kind: "close", template })}
        onDelete={(template) => {
          setDeleteError(null);
          setDialog({ kind: "delete", template });
        }}
      />

      {dialog.kind === "create" ? (
        <ScheduleTemplateFormDialog classId={classId} onClose={close} />
      ) : null}

      {dialog.kind === "revise" ? (
        <ScheduleTemplateFormDialog
          classId={classId}
          template={dialog.template}
          onClose={close}
        />
      ) : null}

      {dialog.kind === "teachers" ? (
        <ScheduleTemplateTeachersDialog template={dialog.template} onClose={close} />
      ) : null}

      {dialog.kind === "close" ? (
        <CloseScheduleTemplateDialog template={dialog.template} onClose={close} />
      ) : null}

      <ConfirmActionDialog
        open={dialog.kind === "delete"}
        onOpenChange={(next) => (next ? undefined : close())}
        title="Xóa lịch cố định?"
        description={deleteDescription(dialog)}
        confirmLabel="Xóa"
        destructive
        errorMessage={deleteError}
        isPending={remove.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}

/**
 * Explains exactly which slot is about to be removed, and on what condition the
 * API will allow it.
 */
function deleteDescription(dialog: OpenDialog): string {
  if (dialog.kind !== "delete") {
    return "";
  }

  const slot = `${DAY_OF_WEEK_LABELS[dialog.template.day_of_week]}, ${formatTimeRange(dialog.template.start_time, dialog.template.end_time)}`;

  return `Lịch ${slot} sẽ bị xóa vĩnh viễn. Chỉ xóa được lịch chưa tới ngày áp dụng và chưa có buổi học nào được ghi dưới nó; lịch đã có hiệu lực thì phải dùng đường đóng lịch để giữ lại lịch sử.`;
}
