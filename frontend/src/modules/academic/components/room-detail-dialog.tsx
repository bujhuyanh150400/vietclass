"use client";

import { InfoDialog, InfoDialogCloseAction } from "@/components/shared/info-dialog";
import { InlineBadge } from "@/components/shared/inline-badge";

import type { Room } from "../types/academic";
import { ROOM_FACILITY_LABELS } from "../utils/labels";
import { RoomCapacity, RoomLocation, RoomStatusBadge } from "./room-cells";

/**
 * Renders everything recorded about one room, without leaving the list.
 *
 * It reads the row already on screen rather than fetching the room again: the
 * list carries every field this shows, so a request here would only add a
 * spinner to information the reader can already see behind the dialog.
 */
export function RoomDetailDialog({
  room,
  onClose,
}: {
  room: Room | null;
  onClose: () => void;
}) {
  return (
    <InfoDialog
      open={room !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Thông tin phòng học"
      description={room === null ? "" : `${room.name} — thông tin phòng học đang lưu.`}
      footer={<InfoDialogCloseAction />}
    >
      {room === null ? null : (
        <div className="grid gap-3">
          <h3 className="text-base font-semibold">{room.name}</h3>

          <p className="text-sm">
            <strong className="mb-1 block font-semibold">Vị trí</strong>
            <RoomLocation location={room.location} />
          </p>

          <p className="text-sm">
            <strong className="mb-1 block font-semibold">Sức chứa</strong>
            <RoomCapacity capacity={room.capacity} />
          </p>

          <div className="text-sm">
            <strong className="mb-2 block font-semibold">Tiện ích</strong>
            <div className="flex flex-wrap gap-1.5">
              {room.facilities.length === 0 ? (
                <span className="text-[11px] font-medium text-muted-foreground italic">
                  Chưa cập nhật
                </span>
              ) : (
                room.facilities.map((facility) => (
                  <InlineBadge
                    key={facility}
                    className="h-7 bg-card px-2 font-sans text-[10px] font-semibold"
                  >
                    {ROOM_FACILITY_LABELS[facility]}
                  </InlineBadge>
                ))
              )}
            </div>
          </div>

          <p className="text-sm">
            <strong className="mb-1 block font-semibold">Ghi chú</strong>
            {room.note === null || room.note === "" ? (
              <span className="text-[11px] font-medium text-muted-foreground italic">
                Chưa có ghi chú
              </span>
            ) : (
              <span className="text-[13px] leading-relaxed">{room.note}</span>
            )}
          </p>

          <div>
            <RoomStatusBadge status={room.status} />
          </div>
        </div>
      )}
    </InfoDialog>
  );
}
