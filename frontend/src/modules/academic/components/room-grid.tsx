"use client";

import Link from "next/link";

import type { DataTableState } from "@/components/shared/data-table";

import type { Room } from "../types/academic";
import { RoomCapacity, RoomLocation, RoomRowMenu, RoomStatusBadge } from "./room-cells";
import { RoomFacilityTags } from "./room-facility-tags";

/**
 * Renders room records as cards.
 *
 * This is both the chosen card view and what the table falls back to on a narrow
 * screen, so it carries the same facts the table's columns do rather than a
 * reduced set — a reader on a phone is not looking for less.
 *
 * Only the content state reaches here: loading, empty, and failure are drawn once
 * by the sheet, whichever layout is active.
 */
export function RoomGrid({
  state,
  onView,
  onDelete,
}: {
  state: Extract<DataTableState<Room>, { kind: "content" }>;
  onView: (room: Room) => void;
  onDelete: (room: Room) => void;
}) {
  return (
    <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
      {state.rows.map((room) => (
        <article
          key={room.id}
          className="min-w-0 rounded-panel border border-vc-rule bg-card p-3.5 transition-shadow hover:border-vc-control hover:shadow-[0_3px_0_var(--vc-shell-rule)] focus-within:border-vc-control"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <h3 className="truncate text-[15px] font-semibold">
              <Link
                href={`/academic/rooms/${room.id}`}
                className="hover:text-vc-orange-deep focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {room.name}
              </Link>
            </h3>
            <RoomRowMenu room={room} onView={onView} onDelete={onDelete} />
          </div>

          <div className="my-3.5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-y border-vc-rule py-3">
            <div className="min-w-0">
              <small className="mb-1 block text-[10px] text-muted-foreground">Vị trí</small>
              <RoomLocation location={room.location} />
            </div>
            <div>
              <small className="mb-1 block text-[10px] text-muted-foreground">Sức chứa</small>
              <RoomCapacity capacity={room.capacity} />
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-muted-foreground">Tiện ích</span>
            <RoomStatusBadge status={room.status} />
          </div>
          <RoomFacilityTags room={room} layout="card" />
        </article>
      ))}
    </div>
  );
}
