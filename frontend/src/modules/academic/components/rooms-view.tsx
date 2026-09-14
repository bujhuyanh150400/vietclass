"use client";

import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";

import {
  DataTablePagination,
  ListSheet,
  StatePanel,
  type DataTableState,
} from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { RoomListSkeleton } from "./room-list-skeleton";
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
      <RoomsHeading total={meta.total} />

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
          hasConditions ? (
            <RoomConditionsBar
              search={search}
              filters={filters}
              sort={sort}
              onSearchChange={onSearchChange}
              onStatusChange={onStatusChange}
              onToggleFacility={onToggleFacility}
              onCapacityMinChange={onCapacityMinChange}
              onCapacityMaxChange={onCapacityMaxChange}
              onSortChange={onSortChange}
              onClearConditions={onClearConditions}
            />
          ) : undefined
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
 * Renders the screen's title block: what this screen is, how many records it
 * holds, and the one action that adds another.
 *
 * The count sits beside the title rather than in the pager because it answers a
 * question about the whole collection, not about the page being read.
 */
function RoomsHeading({ total }: { total: number }) {
  return (
    <div className="flex items-start justify-between gap-3 md:items-end">
      <div>
        <div className="flex flex-col md:flex-row md:items-end md:gap-4">
          {/*
            An `h2`, not an `h1`: the topbar already carries the page's `h1` on
            every protected screen.
          */}
          <h2 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] md:text-4xl">
            Phòng học
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-muted-foreground md:mt-0 md:mb-1.5">
            <strong className="font-mono text-[15px] text-foreground">{total}</strong> phòng
          </p>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground md:text-sm">
          Quản lý vị trí, sức chứa, tiện ích và tình trạng sử dụng.
        </p>
      </div>

      {/*
        The screen's one primary action wears the design system's pressable
        treatment: a wood edge and a solid 3px offset beneath it. The size sits on
        the icon rather than the button, since the Button variant sizes icons
        through `[&_svg:not([class*='size-'])]`.
      */}
      <Button
        asChild
        className="h-11 gap-2 rounded-control border border-vc-wood font-semibold shadow-vc-raised has-[>svg]:px-[15px] max-md:has-[>svg]:px-3"
      >
        <Link href="/academic/rooms/new">
          <Plus aria-hidden="true" className="size-[19px]" />
          <span className="max-md:sr-only">Thêm phòng học</span>
        </Link>
      </Button>
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
    return <RoomListSkeleton />;
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
            <Button type="button" variant="outline" size="sm" onClick={state.onRetry}>
              <RefreshCw aria-hidden="true" />
              Thử lại
            </Button>
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
          <Button type="button" variant="outline" size="sm" onClick={onClearConditions}>
            Xóa điều kiện
          </Button>
        }
      />
    ) : (
      <StatePanel
        image="/images/empty_1.png"
        imageAlt="Chú cú VietClasses vẫy chào"
        title="Chưa có phòng học"
        description="Thêm phòng đầu tiên để bắt đầu sắp xếp không gian học tập."
        action={
          <Button asChild size="sm">
            <Link href="/academic/rooms/new">
              <Plus aria-hidden="true" />
              Thêm phòng học
            </Link>
          </Button>
        }
      />
    );
  }

  // The table needs room its five columns cannot give up, so below `lg` the same
  // rows are read as cards instead. Both trees are rendered and one is hidden with
  // `display: none`, which keeps exactly one of them in the accessibility tree
  // without measuring the viewport in JavaScript — a measurement the server cannot
  // make, and so one that would hydrate to the wrong layout.
  if (view === "grid") {
    return (
      <RoomGrid state={state} onView={onView} onDelete={onDelete} />
    );
  }

  return (
    <>
      <div className="hidden lg:block">
        <RoomTable rows={state.rows} onView={onView} onDelete={onDelete} />
      </div>
      <div className="lg:hidden">
        <RoomGrid state={state} onView={onView} onDelete={onDelete} />
      </div>
    </>
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
  return (
    <Table className="min-w-[1040px] table-fixed">
      <colgroup>
        <col className="w-[22%]" />
        <col className="w-[23%]" />
        <col className="w-[10%]" />
        <col className="w-[28%]" />
        <col className="w-[13%]" />
        <col className="w-[4%]" />
      </colgroup>
      <TableHeader>
        <TableRow className="hover:bg-transparent [&_th]:border-b [&_th]:border-vc-rule [&_th]:px-3 [&_th]:text-[11px] [&_th]:tracking-[0.06em] [&_th]:text-muted-foreground [&_th]:uppercase">
          <TableHead>Phòng học</TableHead>
          <TableHead>Vị trí</TableHead>
          <TableHead>Sức chứa</TableHead>
          <TableHead>Tiện ích</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>
            <span className="sr-only">Thao tác</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((room) => (
          <TableRow
            key={room.id}
            className="group border-vc-rule hover:bg-vc-tint focus-within:bg-vc-tint has-aria-expanded:bg-vc-tint [&_td]:h-[68px] [&_td]:px-3"
          >
            <TableCell>
              <RoomIdentity room={room} />
            </TableCell>
            <TableCell>
              <RoomLocation location={room.location} />
            </TableCell>
            <TableCell>
              <RoomCapacity capacity={room.capacity} />
            </TableCell>
            <TableCell>
              <RoomFacilityTags room={room} />
            </TableCell>
            <TableCell>
              <RoomStatusBadge status={room.status} />
            </TableCell>
            <TableCell>
              <RoomRowMenu
                room={room}
                onView={onView}
                onDelete={onDelete}
                className="opacity-35 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
