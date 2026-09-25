"use client";

import { useState } from "react";

import { InfoDialog, InfoDialogCloseAction } from "@/components/shared/info-dialog";
import { InlineBadge } from "@/components/shared/inline-badge";
import { cn } from "@/lib/utils/index";

import type { Room, RoomFacility } from "../types/academic";
import { ROOM_FACILITY_LABELS } from "../utils/labels";

/**
 * How many facility chips fit before the rest collapse into a count.
 *
 * A table cell has one column to fill and a card has a full row, so the card
 * carries one more chip before collapsing.
 */
const VISIBLE_FACILITIES = { table: 3, card: 4 } as const;

/** Where a group of facility chips is being drawn. */
export type FacilityLayout = keyof typeof VISIBLE_FACILITIES;

/** Renders one facility as a compact chip. */
function FacilityChip({ facility }: { facility: RoomFacility }) {
  return (
    <InlineBadge
      className="h-7 min-w-0 shrink bg-card px-2 font-sans text-[10px] font-semibold whitespace-nowrap"
    >
      {ROOM_FACILITY_LABELS[facility]}
    </InlineBadge>
  );
}

/**
 * Renders the placeholder for a room whose facilities were never recorded.
 *
 * A dashed outline rather than a dash, so the cell reads as a slot waiting to be
 * filled instead of as data that failed to load.
 */
export function EmptyFacilities({ layout = "table" }: { layout?: FacilityLayout }) {
  return (
    <InlineBadge
      className={cn(
        "min-h-7 border-dashed px-2.5 font-sans text-[10px] font-semibold",
        layout === "card" && "w-full justify-center",
      )}
    >
      Chưa cập nhật
    </InlineBadge>
  );
}

/**
 * Renders a room's facilities as chips, collapsing any past the first few into a
 * count that opens the complete list.
 *
 * The dialog lists every facility rather than only the collapsed ones: somebody
 * opening it wants to know what the room has, not what the cell had no space
 * for, and listing only the remainder means tracking an offset for no gain.
 *
 * Owns its own dialog state so the surrounding list stays presentational.
 */
export function RoomFacilityTags({
  room,
  layout = "table",
}: {
  room: Room;
  layout?: FacilityLayout;
}) {
  const [open, setOpen] = useState(false);
  const facilities = room.facilities;

  if (facilities.length === 0) {
    return <EmptyFacilities layout={layout} />;
  }

  const visible = VISIBLE_FACILITIES[layout];
  const collapsed = facilities.length - visible;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-[5px]">
      {facilities.slice(0, visible).map((facility) => (
        <FacilityChip key={facility} facility={facility} />
      ))}

      {collapsed > 0 ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Xem tất cả ${facilities.length} tiện ích của ${room.name}`}
          className="grid h-7 min-w-[32px] shrink-0 place-items-center rounded-control border border-vc-control bg-background px-1.5 font-mono text-[10px] font-bold hover:bg-vc-tint focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          +{collapsed}
        </button>
      ) : null}

      <InfoDialog
        open={open}
        onOpenChange={setOpen}
        title={`Tiện ích · ${room.name}`}
        description={`${room.name} có ${facilities.length} tiện ích.`}
        footer={<InfoDialogCloseAction />}
      >
        <p className="mb-4 text-xs text-muted-foreground">
          {facilities.length} tiện ích được ghi nhận cho phòng này.
        </p>
        <div className="flex flex-wrap gap-2">
          {facilities.map((facility) => (
            <InlineBadge
              key={facility}
              size="xl"
              className="h-9 bg-card px-3 font-sans text-xs font-semibold"
            >
              {ROOM_FACILITY_LABELS[facility]}
            </InlineBadge>
          ))}
        </div>
      </InfoDialog>
    </div>
  );
}
