"use client";

import { Plus, RefreshCw } from "lucide-react";

import {
  DataTablePagination,
  ListSheet,
  ListSkeleton,
  ListTable,
  ResponsiveListView,
  StatePanel,
  type DataTableState,
  type ListTableColumn,
} from "@/components/shared/data-table";
import { AppButton } from "@/components/shared/app-button";
import { InlineBadge } from "@/components/shared/inline-badge";
import { PageHeading } from "@/components/shared/page-heading";
import type { PageMeta } from "@/lib/api/contracts";

import type { Room, RoomFacility, RoomStatus } from "../types/academic";
import {
  ROOM_TABLE_PAGE_SIZES,
  type RoomFilterState,
  type RoomListSort,
  type RoomListView,
} from "../utils/room-list-controls";
import {
  RoomCapacity,
  RoomIdentity,
  RoomLocation,
  RoomRowMenu,
  RoomStatusBadge,
} from "./room-cells";
import { RoomFacilityTags } from "./room-facility-tags";
import { RoomGrid } from "./room-grid";
import {
  RoomConditionsBar,
  RoomListToolbar,
  hasRoomConditions,
} from "./room-list-toolbar";

/** What the room list screen renders and reports back. */
export type RoomsViewProps = {
  state: DataTableState<Room>;
  meta: PageMeta;
  search: string;
  filters: RoomFilterState;
  filterCount: number;
  sort: RoomListSort;
  view: RoomListView;
  tablePageSize: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: RoomStatus | null) => void;
  onToggleFacility: (facility: RoomFacility) => void;
  onCapacityMinChange: (capacity: number | null) => void;
  onCapacityMaxChange: (capacity: number | null) => void;
  onClearFilters: () => void;
  onSortChange: (sort: RoomListSort) => void;
  onViewChange: (view: RoomListView) => void;
  onTablePageSizeChange: (pageSize: number) => void;
  onClearConditions: () => void;
  onPageChange: (page: number) => void;
  onView: (room: Room) => void;
  onDelete: (room: Room) => void;
};

/**
 * Renders the room list: the heading, one sheet holding the controls and the
 * rows, and the pager along its bottom edge.
 *
 * Location and facilities sit beside the room rather than behind a detail screen,
 * because between them they answer what anyone looking a room up came for: where
 * it is, and whether it has what the lesson needs.
 *
 * Presentational: it holds no query, mutation, or navigation state of its own.
 */
export function RoomsView({
  state,
  meta,
  search,
  filters,
  filterCount,
  sort,
  view,
  tablePageSize,
  onSearchChange,
  onStatusChange,
  onToggleFacility,
  onCapacityMinChange,
  onCapacityMaxChange,
  onClearFilters,
  onSortChange,
  onViewChange,
  onTablePageSizeChange,
  onClearConditions,
  onPageChange,
  onView,
  onDelete,
}: RoomsViewProps) {
  const hasConditions = hasRoomConditions({ search, filterCount, sort });

  return (
    <div className="grid gap-6">
      <PageHeading
        title="Phòng học"
        badges={
          <InlineBadge>
            <strong className="text-xs text-foreground">{meta.total}</strong> phòng
          </InlineBadge>
        }
        description="Quản lý vị trí, sức chứa, tiện ích và tình trạng sử dụng."
        action={
          <AppButton href="/academic/rooms/new">
            <Plus aria-hidden="true" className="size-[19px]" />
            Thêm phòng học
          </AppButton>
        }
      />

      <ListSheet
        toolbar={
          <RoomListToolbar
            search={search}
            onSearchChange={onSearchChange}
            filters={filters}
            filterCount={filterCount}
            sort={sort}
            view={view}
            onStatusChange={onStatusChange}
            onToggleFacility={onToggleFacility}
            onCapacityMinChange={onCapacityMinChange}
            onCapacityMaxChange={onCapacityMaxChange}
            onClearFilters={onClearFilters}
            onSortChange={onSortChange}
            onViewChange={onViewChange}
          />
        }
        conditions={
          <RoomConditionsBar
            search={search}
            filters={filters}
            sort={sort}
            hasConditions={hasConditions}
            onSearchChange={onSearchChange}
            onStatusChange={onStatusChange}
            onToggleFacility={onToggleFacility}
            onCapacityMinChange={onCapacityMinChange}
            onCapacityMaxChange={onCapacityMaxChange}
            onSortChange={onSortChange}
            onClearConditions={onClearConditions}
          />
        }
        pager={
          state.kind === "content" ? (
            <DataTablePagination
              numbered
              unit="phòng"
              meta={meta}
              onPageChange={onPageChange}
              pageSize={view === "table" ? tablePageSize : undefined}
              pageSizeOptions={view === "table" ? ROOM_TABLE_PAGE_SIZES : undefined}
              onPageSizeChange={view === "table" ? onTablePageSizeChange : undefined}
            />
          ) : undefined
        }
      >
        <div aria-busy={state.kind === "loading"}>
          <RoomResults
            state={state}
            view={view}
            hasConditions={hasConditions}
            onClearConditions={onClearConditions}
            onView={onView}
            onDelete={onDelete}
          />
        </div>
      </ListSheet>
    </div>
  );
}

/**
 * Renders whichever of the four list states currently applies.
 *
 * Every state stays inside the sheet, including "nothing here yet": the toolbar
 * above it is how a reader gets back out of a search that matched nothing, and
 * removing it under them would strand them.
 */
function RoomResults({
  state,
  view,
  hasConditions,
  onClearConditions,
  onView,
  onDelete,
}: {
  state: DataTableState<Room>;
  view: RoomListView;
  hasConditions: boolean;
  onClearConditions: () => void;
  onView: (room: Room) => void;
  onDelete: (room: Room) => void;
}) {
  if (state.kind === "loading") {
    return (
      <ListSkeleton
        view={view}
        label="Đang tải danh sách phòng học"
        table={{
          columnCount: 6,
          columnTemplate: "22fr 23fr 10fr 28fr 13fr 4fr",
          shortCycle: 5,
        }}
      />
    );
  }

  if (state.kind === "error") {
    return (
      <StatePanel
        role="alert"
        image="/images/error.webp"
        imageAlt="Chú cú VietClasses hoa mắt vì tải dữ liệu thất bại"
        title="Chưa tải được danh sách"
        description={state.message}
        action={
          state.onRetry ? (
            <AppButton size="sm" variant="outline" onClick={state.onRetry}>
              <RefreshCw aria-hidden="true" />
              Thử lại
            </AppButton>
          ) : undefined
        }
      />
    );
  }

  if (state.kind === "empty") {
    return hasConditions ? (
      <StatePanel
        image="/images/empty_2.png"
        imageAlt="Chú cú VietClasses cầm kính lúp tìm kiếm"
        title="Không tìm thấy phòng phù hợp"
        description="Thử đổi từ khóa, khoảng sức chứa hoặc bỏ bớt tiện ích đang chọn."
        action={
          <AppButton size="sm" variant="outline" onClick={onClearConditions}>
            Xóa điều kiện
          </AppButton>
        }
      />
    ) : (
      <StatePanel
        image="/images/empty_1.png"
        imageAlt="Chú cú VietClasses vẫy chào"
        title="Chưa có phòng học"
        description="Thêm phòng đầu tiên để bắt đầu sắp xếp không gian học tập."
        action={
          <AppButton href="/academic/rooms/new" size="sm">
            <Plus aria-hidden="true" />
            Thêm phòng học
          </AppButton>
        }
      />
    );
  }

  // The table needs room its five columns cannot give up, so below `lg` the same
  // rows are read as cards instead. Both trees are rendered and one is hidden with
  // `display: none`, which keeps exactly one of them in the accessibility tree
  // without measuring the viewport in JavaScript — a measurement the server cannot
  // make, and so one that would hydrate to the wrong layout.
  return (
    <ResponsiveListView
      view={view}
      table={<RoomTable rows={state.rows} onView={onView} onDelete={onDelete} />}
      grid={<RoomGrid state={state} onView={onView} onDelete={onDelete} />}
    />
  );
}

/**
 * Renders the room rows as a table.
 *
 * The column widths are fixed rather than content-driven so the facility chips,
 * which vary most in width, cannot squeeze the location column down to one word
 * on a row that happens to carry five of them.
 */
function RoomTable({
  rows,
  onView,
  onDelete,
}: {
  rows: Room[];
  onView: (room: Room) => void;
  onDelete: (room: Room) => void;
}) {
  const columns: ListTableColumn<Room>[] = [
    {
      key: "room",
      header: "Phòng học",
      width: 22,
      cell: (room) => <RoomIdentity room={room} />,
    },
    {
      key: "location",
      header: "Vị trí",
      width: 23,
      cell: (room) => <RoomLocation location={room.location} />,
    },
    {
      key: "capacity",
      header: "Sức chứa",
      width: 10,
      cell: (room) => <RoomCapacity capacity={room.capacity} />,
    },
    {
      key: "facilities",
      header: "Tiện ích",
      width: 28,
      cell: (room) => <RoomFacilityTags room={room} />,
    },
    {
      key: "status",
      header: "Trạng thái",
      width: 13,
      cell: (room) => <RoomStatusBadge status={room.status} />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      width: 4,
      cell: (room) => (
        <RoomRowMenu
          room={room}
          onView={onView}
          onDelete={onDelete}
          className="opacity-35 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
        />
      ),
    },
  ];

  return (
    <ListTable
      ariaLabel="Danh sách phòng học"
      columns={columns}
      rows={rows}
      rowKey={(room) => room.id}
      minWidth={1040}
    />
  );
}
