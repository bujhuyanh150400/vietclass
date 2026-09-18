"use client";

import { ArrowDownAZ, ArrowDownZA, ArrowUpDown } from "lucide-react";

import {
  ConditionTag,
  ConditionsBar,
  FilterPopover,
  FilterSection,
  ListToolbar,
  SortPopover,
  ViewPopover,
  type SortOption,
} from "@/components/shared/data-table";

import type { RoomFacility, RoomStatus } from "../types/academic";
import { ROOM_FACILITIES, ROOM_FACILITY_LABELS, ROOM_STATUS_LABELS } from "../utils/labels";
import {
  ROOM_LIST_SORT_LABELS,
  type RoomFilterState,
  type RoomListSort,
  type RoomListView,
} from "../utils/room-list-controls";

/** Visible labels for each supported room sort, in menu order. */
const SORT_OPTIONS: SortOption<RoomListSort>[] = [
  { value: "name-asc", label: ROOM_LIST_SORT_LABELS["name-asc"], icon: <ArrowDownAZ aria-hidden="true" className="size-3.5" /> },
  { value: "name-desc", label: ROOM_LIST_SORT_LABELS["name-desc"], icon: <ArrowDownZA aria-hidden="true" className="size-3.5" /> },
  { value: "capacity-asc", label: ROOM_LIST_SORT_LABELS["capacity-asc"], icon: <ArrowUpDown aria-hidden="true" className="size-3.5" /> },
  { value: "capacity-desc", label: ROOM_LIST_SORT_LABELS["capacity-desc"], icon: <ArrowUpDown aria-hidden="true" className="size-3.5" /> },
  { value: "newest", label: ROOM_LIST_SORT_LABELS.newest, icon: <ArrowUpDown aria-hidden="true" className="size-3.5" /> },
];

/**
 * Every control the room list screen owns.
 *
 * One type for both the toolbar and the conditions bar: the two render the same
 * controls from opposite ends — one applies a condition, the other removes it —
 * so a control added to one and not the other would be a control a reader can
 * set but not clear.
 */
type RoomListControls = {
  search: string;
  onSearchChange: (value: string) => void;
  filters: RoomFilterState;
  filterCount: number;
  sort: RoomListSort;
  view: RoomListView;
  onStatusChange: (status: RoomStatus | null) => void;
  onToggleFacility: (facility: RoomFacility) => void;
  onCapacityMinChange: (capacity: number | null) => void;
  onCapacityMaxChange: (capacity: number | null) => void;
  onClearFilters: () => void;
  onSortChange: (sort: RoomListSort) => void;
  onViewChange: (view: RoomListView) => void;
  onClearConditions: () => void;
};

/**
 * Reads one capacity box back as a number, or as "no bound" when it is emptied.
 *
 * An empty box must clear the filter rather than send `0`, which would otherwise
 * read as a real lower bound and quietly exclude nothing while looking applied.
 */
function capacityValue(raw: string): number | null {
  const trimmed = raw.trim();

  if (trimmed === "") return null;

  const parsed = Number(trimmed);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

/** Renders the Search, Filter, Sort, and View row printed along the sheet's top edge. */
export function RoomListToolbar({
  search,
  onSearchChange,
  filters,
  filterCount,
  sort,
  view,
  onStatusChange,
  onToggleFacility,
  onCapacityMinChange,
  onCapacityMaxChange,
  onClearFilters,
  onSortChange,
  onViewChange,
}: Omit<RoomListControls, "onClearConditions">) {
  return (
    <ListToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Tìm theo tên hoặc vị trí phòng…"
      searchAriaLabel="Tìm kiếm phòng học"
      searchHelpText="Tìm theo tên phòng và vị trí. Bỏ dấu tiếng Việt vẫn tìm được."
      align="start"
      size="control"
    >
      <FilterPopover
        compact
        count={filterCount}
        onClear={onClearFilters}
        note="Thay đổi được áp dụng ngay."
      >
        <FilterSection label="Trạng thái">
          <div className="grid grid-cols-4 overflow-hidden rounded-control border">
            {([
              [null, "Tất cả"],
              [0, ROOM_STATUS_LABELS[0]],
              [1, ROOM_STATUS_LABELS[1]],
              [2, ROOM_STATUS_LABELS[2]],
            ] as const).map(([value, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={filters.status === value}
                onClick={() => onStatusChange(value)}
                className="h-8 border-r px-1 text-[11px] last:border-r-0 hover:bg-orange-50 aria-pressed:bg-orange-50 aria-pressed:font-medium aria-pressed:text-vc-orange-deep"
              >
                {label}
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection label="Sức chứa">
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1">
              <span className="sr-only">Sức chứa tối thiểu</span>
              <input
                type="number"
                min={0}
                max={32767}
                inputMode="numeric"
                placeholder="Tối thiểu"
                value={filters.capacityMin ?? ""}
                onChange={(event) => onCapacityMinChange(capacityValue(event.target.value))}
                className="h-9 w-full rounded-control border bg-card px-2 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
            </label>
            <label className="grid gap-1">
              <span className="sr-only">Sức chứa tối đa</span>
              <input
                type="number"
                min={0}
                max={32767}
                inputMode="numeric"
                placeholder="Tối đa"
                value={filters.capacityMax ?? ""}
                onChange={(event) => onCapacityMaxChange(capacityValue(event.target.value))}
                className="h-9 w-full rounded-control border bg-card px-2 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
            </label>
          </div>
        </FilterSection>

        <FilterSection label="Tiện ích" last>
          {/*
            Ticking two facilities narrows to rooms carrying both, not either, so
            the note says which: a reader who expects "any" would read an empty
            result as a fault rather than as the filter working.
          */}
          <div className="flex flex-wrap gap-1.5">
            {ROOM_FACILITIES.map((facility) => (
              <button
                key={facility}
                type="button"
                aria-pressed={filters.facilities.includes(facility)}
                onClick={() => onToggleFacility(facility)}
                className="h-7 rounded-control border px-2 text-[11px] font-medium transition-colors hover:bg-orange-50 aria-pressed:border-vc-orange/50 aria-pressed:bg-orange-50 aria-pressed:text-vc-orange-deep"
              >
                {ROOM_FACILITY_LABELS[facility]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Phòng phải có đủ mọi tiện ích được chọn.
          </p>
        </FilterSection>
      </FilterPopover>

      <SortPopover
        compact
        value={sort}
        options={SORT_OPTIONS}
        onChange={onSortChange}
        isActive={sort !== "newest"}
      />

      <ViewPopover
        compact
        value={view}
        onChange={onViewChange}
        note="Dạng thẻ luôn hiển thị 20 mục mỗi trang."
      />
    </ListToolbar>
  );
}

/**
 * Reports whether anything is currently narrowing the collection, so the sheet
 * knows whether to print a conditions bar at all.
 */
export function hasRoomConditions({
  search,
  filterCount,
  sort,
}: {
  search: string;
  filterCount: number;
  sort: RoomListSort;
}): boolean {
  return search !== "" || filterCount > 0 || sort !== "newest";
}

/**
 * Renders every applied condition as a removable chip.
 *
 * Each chip is captioned with the control that produced it, because a bar holding
 * "40" and "Máy chiếu" side by side otherwise relies on the reader remembering
 * which filter they touched. Facilities get one chip each rather than one chip
 * for the group, since they are removed one at a time.
 *
 * Sort appears here too: it is not a filter, but it changes which rooms land on
 * the page being read, so leaving it out would make the first page look arbitrary.
 */
export function RoomConditionsBar({
  search,
  filters,
  sort,
  onSearchChange,
  onStatusChange,
  onToggleFacility,
  onCapacityMinChange,
  onCapacityMaxChange,
  onSortChange,
  onClearConditions,
}: Pick<
  RoomListControls,
  | "search"
  | "filters"
  | "sort"
  | "onSearchChange"
  | "onStatusChange"
  | "onToggleFacility"
  | "onCapacityMinChange"
  | "onCapacityMaxChange"
  | "onSortChange"
  | "onClearConditions"
>) {
  return (
    <ConditionsBar heading="Đang áp dụng" align="start" onClearAll={onClearConditions}>
      {search ? (
        <ConditionTag
          tone="neutral"
          caption="Từ khóa"
          label={`“${search}”`}
          onRemove={() => onSearchChange("")}
        />
      ) : null}

      {filters.status !== null ? (
        <ConditionTag
          tone="neutral"
          caption="Trạng thái"
          label={ROOM_STATUS_LABELS[filters.status]}
          onRemove={() => onStatusChange(null)}
        />
      ) : null}

      {filters.capacityMin !== null ? (
        <ConditionTag
          tone="neutral"
          caption="Sức chứa từ"
          label={`${filters.capacityMin} chỗ`}
          onRemove={() => onCapacityMinChange(null)}
        />
      ) : null}

      {filters.capacityMax !== null ? (
        <ConditionTag
          tone="neutral"
          caption="Sức chứa đến"
          label={`${filters.capacityMax} chỗ`}
          onRemove={() => onCapacityMaxChange(null)}
        />
      ) : null}

      {filters.facilities.map((facility) => (
        <ConditionTag
          key={`facility-${facility}`}
          tone="neutral"
          caption="Tiện ích"
          label={ROOM_FACILITY_LABELS[facility]}
          onRemove={() => onToggleFacility(facility)}
        />
      ))}

      {sort !== "newest" ? (
        <ConditionTag
          tone="neutral"
          caption="Sắp xếp"
          label={ROOM_LIST_SORT_LABELS[sort]}
          onRemove={() => onSortChange("newest")}
        />
      ) : null}
    </ConditionsBar>
  );
}
