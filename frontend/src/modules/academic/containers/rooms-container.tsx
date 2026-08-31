"use client";

import { useState } from "react";

import { isApiClientError } from "@/lib/api/api-client-error";

import { ConfirmActionDialog } from "../components/confirm-action-dialog";
import { RoomsView } from "../components/rooms-view";
import { useChangeRoomStatus, useDeleteRoom, useRoomList } from "../hooks/use-rooms";
import type { Room, RoomStatus } from "../types/academic";
import { ROOM_STATUS_LABELS } from "../utils/labels";

/** Which confirmation, if any, is currently open for a room. */
type PendingAction =
  | { kind: "none" }
  | { kind: "delete"; room: Room }
  | { kind: "status"; room: Room; status: RoomStatus };

/**
 * Coordinates the room list, its availability filter, and the two room mutations.
 *
 * A status change and deletion are both confirmed because they can remove a room
 * from future scheduling or erase it altogether. The dialog remains open on a
 * refusal, so the caller sees the API's reason instead of losing its context.
 */
export function RoomsContainer() {
  const [status, setStatus] = useState<RoomStatus | undefined>();
  const list = useRoomList(status);
  const changeStatus = useChangeRoomStatus();
  const remove = useDeleteRoom();

  const [pending, setPending] = useState<PendingAction>({ kind: "none" });
  const [actionError, setActionError] = useState<string | null>(null);

  /** Opens one room mutation confirmation and clears the prior refusal message. */
  function open(action: PendingAction) {
    setActionError(null);
    setPending(action);
  }

  /** Closes the confirmation without changing the selected room. */
  function close() {
    setActionError(null);
    setPending({ kind: "none" });
  }

  /** Keeps an API refusal visible inside the confirmation that caused it. */
  function reportFailure(error: unknown) {
    setActionError(
      isApiClientError(error) ? error.message : "Không thực hiện được thao tác này.",
    );
  }

  /** Applies the selected room mutation and closes only after a successful response. */
  async function confirm() {
    if (pending.kind === "none") {
      return;
    }

    try {
      if (pending.kind === "delete") {
        await remove.mutateAsync(pending.room.id);
      } else {
        await changeStatus.mutateAsync({ id: pending.room.id, status: pending.status });
      }

      close();
    } catch (error) {
      reportFailure(error);
    }
  }

  const room = pending.kind === "none" ? null : pending.room;
  const isDeleting = pending.kind === "delete";
  const targetStatus = pending.kind === "status" ? pending.status : undefined;

  return (
    <>
      <RoomsView
        state={list.state}
        meta={list.meta}
        search={list.query.q}
        status={status}
        onSearchChange={list.query.setSearch}
        onStatusChange={setStatus}
        onPageChange={list.query.setPage}
        onChangeStatus={(target, next) => open({ kind: "status", room: target, status: next })}
        onDelete={(target) => open({ kind: "delete", room: target })}
      />

      <ConfirmActionDialog
        open={pending.kind !== "none"}
        onOpenChange={(next) => (next ? undefined : close())}
        title={isDeleting ? "Xóa phòng học?" : "Đổi trạng thái phòng học?"}
        description={confirmationDescription(room, isDeleting, targetStatus)}
        confirmLabel={isDeleting ? "Xóa" : "Đổi trạng thái"}
        destructive={isDeleting}
        errorMessage={actionError}
        isPending={changeStatus.isPending || remove.isPending}
        onConfirm={() => void confirm()}
      />
    </>
  );
}

/**
 * Explains the exact room action awaiting confirmation.
 */
function confirmationDescription(
  room: Room | null,
  isDeleting: boolean,
  targetStatus: RoomStatus | undefined,
): string {
  if (room === null) {
    return "";
  }

  if (isDeleting) {
    return `Phòng học "${room.name}" sẽ bị xóa vĩnh viễn. Chỉ xóa được khi chưa có lịch học tham chiếu.`;
  }

  return `Phòng học "${room.name}" sẽ chuyển sang trạng thái ${ROOM_STATUS_LABELS[targetStatus ?? room.status]}.`;
}
