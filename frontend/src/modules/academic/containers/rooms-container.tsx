"use client";

import { useState } from "react";

import { useToast } from "@/components/shared/toast-provider";
import { isApiClientError } from "@/lib/api/api-client-error";

import { RoomDeleteDialog } from "../components/room-delete-dialog";
import { RoomDetailDialog } from "../components/room-detail-dialog";
import { RoomsView } from "../components/rooms-view";
import { useDeleteRoom, useRoomList } from "../hooks/use-rooms";
import type { Room } from "../types/academic";

/**
 * Coordinates the room list, its URL-backed controls, and the delete mutation.
 *
 * Availability status is no longer changed from the list: it is a field on the
 * edit form like any other, so the row menu only opens the detail dialog, the
 * edit form, or this confirmation. Deletion stays confirmed because it removes
 * a room from future scheduling for good; the dialog switches to an
 * acknowledgement-only notice on a refusal rather than staying a retryable
 * confirmation, since a schedule-in-use refusal cannot be resolved by trying
 * the same delete again.
 */
export function RoomsContainer() {
  const list = useRoomList();
  const remove = useDeleteRoom();
  const showToast = useToast();

  const [pendingDelete, setPendingDelete] = useState<Room | null>(null);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Room | null>(null);

  /** Opens the delete confirmation and clears any prior refusal. */
  function openDelete(room: Room) {
    setBlockedReason(null);
    setPendingDelete(room);
  }

  /** Closes the confirmation without changing the selected room. */
  function close() {
    setBlockedReason(null);
    setPendingDelete(null);
  }

  /** Deletes the selected room, or records why the API refused to. */
  async function confirmDelete() {
    if (pendingDelete === null) {
      return;
    }

    try {
      await remove.mutateAsync(pendingDelete.id);
      showToast({ variant: "success", title: `Đã xóa phòng học "${pendingDelete.name}".` });
      close();
    } catch (error) {
      setBlockedReason(
        isApiClientError(error) ? error.message : "Không thực hiện được thao tác này.",
      );
    }
  }

  return (
    <>
      <RoomsView
        state={list.state}
        meta={list.meta}
        search={list.query.q}
        filters={list.filters}
        filterCount={list.filterCount}
        sort={list.sort}
        view={list.view}
        tablePageSize={list.tablePageSize}
        onSearchChange={list.query.setSearch}
        onStatusChange={list.setStatus}
        onToggleFacility={list.toggleFacility}
        onCapacityMinChange={list.setCapacityMin}
        onCapacityMaxChange={list.setCapacityMax}
        onClearFilters={list.clearFilters}
        onSortChange={list.setSort}
        onViewChange={list.setView}
        onTablePageSizeChange={list.setTablePageSize}
        onClearConditions={list.clearConditions}
        onPageChange={list.query.setPage}
        onView={setViewing}
        onDelete={openDelete}
      />

      <RoomDetailDialog room={viewing} onClose={() => setViewing(null)} />

      <RoomDeleteDialog
        room={pendingDelete}
        blockedReason={blockedReason}
        isPending={remove.isPending}
        onConfirm={() => void confirmDelete()}
        onClose={close}
      />
    </>
  );
}
