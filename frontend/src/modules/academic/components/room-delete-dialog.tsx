"use client";

import { DoorOpen, X } from "lucide-react";
import type { ReactNode } from "react";

import { DialogClose } from "@/components/ui/dialog";
import { InfoDialog, InfoDialogCloseAction } from "@/components/shared/info-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/index";

import type { Room } from "../types/academic";

/**
 * Renders which room a destructive confirmation is about: an icon mark plus
 * its name inside a bordered card, so a reader confirming deletion is looking
 * at the room's identity set apart from the surrounding prose, not a name that
 * happens to appear partway through a sentence.
 */
function RoomDeleteTarget({ room }: { room: Room }) {
  return (
    <div className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-[11px] rounded-control border border-vc-rule bg-vc-tint p-3">
      <span
        aria-hidden="true"
        className="grid size-10 place-items-center rounded-control border border-vc-control bg-card"
      >
        <DoorOpen className="size-[18px]" />
      </span>
      <strong className="text-xs font-semibold">{room.name}</strong>
    </div>
  );
}

/**
 * Renders one callout note beneath the target card: a tan box for the neutral
 * follow-up instruction, a tinted red one for the point that cannot be undone.
 * The main sentence above it stays plain text — only the note that qualifies
 * it gets the bordered treatment.
 */
function DeleteNote({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "danger";
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "rounded-control border p-3 text-[11px] leading-relaxed",
        tone === "danger"
          ? "border-destructive/28 bg-destructive/7 text-destructive"
          : "border-vc-rule bg-vc-tint",
      )}
    >
      {children}
    </p>
  );
}

/**
 * Confirms deleting a room, on the same two-state design a schedule-in-use
 * refusal calls for: a plain confirmation when nothing blocks it, and an
 * acknowledgement-only notice — no confirm action to retry, since retrying
 * immediately would refuse the same way — once the API has actually refused.
 *
 * The blocked copy is the API's own refusal message rather than a canned
 * string, so the count of schedules in the way stays accurate without this
 * component tracking that count itself.
 */
export function RoomDeleteDialog({
  room,
  blockedReason,
  isPending,
  onConfirm,
  onClose,
}: {
  room: Room | null;
  /** The API's refusal message from the previous attempt, or `null` before any attempt. */
  blockedReason: string | null;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const blocked = blockedReason !== null;

  return (
    <InfoDialog
      open={room !== null}
      onOpenChange={(open) => !open && onClose()}
      title={blocked ? "Không thể xóa phòng học" : "Xóa phòng học?"}
      description={
        room === null
          ? ""
          : blocked
            ? `Không thể xóa ${room.name}: ${blockedReason}`
            : `Xác nhận xóa ${room.name}.`
      }
      footer={
        blocked ? (
          <InfoDialogCloseAction label="Đã hiểu" />
        ) : (
          <>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-control border-vc-rule bg-transparent px-4 hover:border-foreground hover:bg-vc-tint hover:text-foreground"
              >
                Hủy
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              className="h-11 gap-2 rounded-control px-4"
              disabled={isPending}
              onClick={onConfirm}
            >
              <X aria-hidden="true" className="size-4" />
              {isPending ? "Đang xóa…" : "Xóa phòng học"}
            </Button>
          </>
        )
      }
    >
      {room === null ? null : (
        <div className="grid gap-4">
          <RoomDeleteTarget room={room} />

          {blocked ? (
            <>
              <p className="text-sm">{blockedReason}</p>
              <DeleteNote>
                Hãy chuyển các lịch sang phòng khác trước. Thông tin phòng và lịch sử liên quan
                vẫn được giữ nguyên.
              </DeleteNote>
            </>
          ) : (
            <>
              <p className="text-sm">
                Phòng hiện chưa có lịch nào tham chiếu và có thể xóa khỏi danh sách.
              </p>
              <DeleteNote tone="danger">Thao tác này không thể hoàn tác.</DeleteNote>
            </>
          )}
        </div>
      )}
    </InfoDialog>
  );
}
