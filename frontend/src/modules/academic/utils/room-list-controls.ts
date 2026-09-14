import type { RoomListParams } from "../api/rooms-api";
import type { RoomFacility, RoomStatus } from "../types/academic";

/** Sort modes exposed by the room list. */
export type RoomListSort = "newest" | "name-asc" | "name-desc" | "capacity-asc" | "capacity-desc";

/** Values shared by URL parsing and the sort picker. */
export const ROOM_LIST_SORTS: RoomListSort[] = [
  "newest",
  "name-asc",
  "name-desc",
  "capacity-asc",
  "capacity-desc",
];

/** Vietnamese wording for each sort mode, shown in the picker and the condition chip. */
export const ROOM_LIST_SORT_LABELS: Record<RoomListSort, string> = {
  newest: "Mặc định",
  "name-asc": "Phòng học A → Z",
  "name-desc": "Phòng học Z → A",
  "capacity-asc": "Sức chứa: ít → nhiều",
  "capacity-desc": "Sức chứa: nhiều → ít",
};

/** The two ways the list can be read. */
export type RoomListView = "table" | "grid";

/** Values shared by URL parsing and the view picker. */
export const ROOM_LIST_VIEWS: RoomListView[] = ["table", "grid"];

/** Page densities appropriate for the room table. */
export const ROOM_TABLE_PAGE_SIZES = [10, 20, 50, 100] as const;

/** Filters which narrow the list independently of its keyword. */
export type RoomFilterState = {
  status: RoomStatus | null;
  facilities: RoomFacility[];
  capacityMin: number | null;
  capacityMax: number | null;
};

/**
 * Converts the visible controls to the backend query contract.
 *
 * Every filter is omitted rather than sent empty, so a list with nothing applied
 * asks for exactly the same URL it did before any of these controls existed.
 */
export function buildRoomListParams(
  controls: RoomFilterState & { sort: RoomListSort },
): Partial<RoomListParams> {
  const ordering = {
    newest: { sort: "created_at", direction: "desc" },
    "name-asc": { sort: "name", direction: "asc" },
    "name-desc": { sort: "name", direction: "desc" },
    "capacity-asc": { sort: "capacity", direction: "asc" },
    "capacity-desc": { sort: "capacity", direction: "desc" },
  } satisfies Record<RoomListSort, { sort: NonNullable<RoomListParams["sort"]>; direction: "asc" | "desc" }>;

  return {
    ...(controls.status === null ? {} : { status: controls.status }),
    ...(controls.facilities.length === 0 ? {} : { facilities: controls.facilities }),
    ...(controls.capacityMin === null ? {} : { capacity_min: controls.capacityMin }),
    ...(controls.capacityMax === null ? {} : { capacity_max: controls.capacityMax }),
    ...ordering[controls.sort],
  };
}

/**
 * Counts applied filter groups for the compact filter affordance.
 *
 * Facilities count once however many are ticked, matching the one chip the filter
 * button shows; the conditions bar is where each facility is named separately.
 */
export function activeRoomFilterCount(filters: RoomFilterState): number {
  return (
    Number(filters.status !== null) +
    Number(filters.facilities.length > 0) +
    Number(filters.capacityMin !== null) +
    Number(filters.capacityMax !== null)
  );
}
