"use client";

import Link from "next/link";
import { DoorOpen, Pencil, Trash2 } from "lucide-react";

import { RowActionMenu, type RowAction } from "@/components/shared/data-table";
import { cn } from "@/lib/utils/index";

import type { Room, RoomStatus } from "../types/academic";
import { ROOM_STATUS_LABELS } from "../utils/labels";

/** The border, ground, and text each availability state is drawn in. */
const STATUS_TONE: Record<RoomStatus, string> = {
  0: "border-vc-leaf/30 bg-vc-leaf/10 text-vc-leaf",
  1: "border-destructive/25 bg-destructive/10 text-destructive",
  2: "border-vc-control bg-background text-muted-foreground",
};

/**
 * Reports whether a room can be scheduled into, as a badge carrying a dot.
 *
 * The dot takes the badge's own colour, so the three states stay apart for a
 * reader who cannot separate the border tints.
 */
export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-control border px-2 py-1 text-[11px] font-bold whitespace-nowrap",
        STATUS_TONE[status],
      )}
    >
      <span aria-hidden="true" className="size-[7px] rounded-full bg-current" />
      {ROOM_STATUS_LABELS[status]}
    </span>
  );
}

/**
 * Renders how many seats a room holds, with the number in the mono face.
 *
 * The digits line up down the column that way, so two rooms can be compared by
 * eye without reading the unit on every row.
 */
export function RoomCapacity({ capacity, className }: { capacity: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1 whitespace-nowrap", className)}>
      <strong className="font-mono text-[13px] font-semibold">{capacity}</strong>
      <small className="text-[10px] text-muted-foreground">chỗ</small>
    </span>
  );
}

/**
 * Renders a room's location, or a marker that nobody has recorded one.
 *
 * Italic muted words rather than a dash: the cell is describing a gap in the
 * record, which a dash reads as an error instead.
 */
export function RoomLocation({ location }: { location: string | null }) {
  if (location === null || location === "") {
    return <span className="text-[11px] font-medium text-muted-foreground italic">Chưa cập nhật</span>;
  }

  return <span className="block max-w-[30ch] text-[11px] leading-relaxed">{location}</span>;
}

/** Renders a room's name as the link into its edit form. */
export function RoomIdentity({ room }: { room: Room }) {
  return (
    <Link
      href={`/academic/rooms/${room.id}`}
      className="block truncate text-[13px] font-semibold hover:text-vc-orange-deep focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {room.name}
    </Link>
  );
}

/**
 * Renders the per-room action menu on the shared `RowActionMenu` primitive.
 *
 * Shared by the table and the cards so the two layouts cannot drift into
 * offering different actions for the same room. Matches the approved mock's
 * two-item menu (Xem thông tin, Sửa phòng học) plus one addition: a quick
 * per-status shortcut no longer belongs here now that status is a field on the
 * edit form itself, but deleting a room has no other entry point anywhere in
 * the design, so it stays, set apart by its own separator.
 */
export function RoomRowMenu({
  room,
  onView,
  onDelete,
  className,
}: {
  room: Room;
  onView: (room: Room) => void;
  onDelete: (room: Room) => void;
  className?: string;
}) {
  const actions: RowAction[] = [
    {
      key: "view",
      label: "Xem thông tin",
      // Explicit ink colour: the shared item otherwise mutes any icon lacking a
      // `text-*` class of its own, and the mock draws these in the same dark
      // ink as the label, not a faded grey.
      icon: <DoorOpen aria-hidden="true" className="text-foreground" />,
      onSelect: () => onView(room),
    },
    {
      key: "edit",
      label: "Sửa phòng học",
      icon: <Pencil aria-hidden="true" className="text-foreground" />,
      href: `/academic/rooms/${room.id}`,
    },
    "separator",
    {
      key: "delete",
      label: "Xóa",
      icon: <Trash2 aria-hidden="true" />,
      variant: "destructive",
      onSelect: () => onDelete(room),
    },
  ];

  return (
    <RowActionMenu
      actions={actions}
      triggerLabel={`Thao tác với ${room.name}`}
      triggerClassName={className}
    />
  );
}
