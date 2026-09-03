"use client";

import Link from "next/link";
import { MoreHorizontal, Plus } from "lucide-react";

import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  EmptyState,
  type DataTableColumn,
  type DataTableState,
} from "@/components/shared/data-table";
import { SelectField } from "@/components/shared/select-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PageMeta } from "@/lib/api/contracts";

import type { Room, RoomStatus } from "../types/academic";
import { ROOM_STATUS_LABELS } from "../utils/labels";

/** The select value representing an unfiltered room list. */
const ALL_STATUSES = -1;

/** The availability filters a reader may apply to the room list. */
const STATUS_FILTER_CHOICES = [
  { value: ALL_STATUSES, label: "Tất cả trạng thái" },
  { value: 0, label: ROOM_STATUS_LABELS[0] },
  { value: 1, label: ROOM_STATUS_LABELS[1] },
  { value: 2, label: ROOM_STATUS_LABELS[2] },
];

/** The status changes available from a room row. */
const ROOM_STATUSES: RoomStatus[] = [0, 1, 2];

/** What the room list screen renders and reports back. */
export type RoomsViewProps = {
  state: DataTableState<Room>;
  meta: PageMeta;
  search: string;
  status: RoomStatus | undefined;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: RoomStatus | undefined) => void;
  onPageChange: (page: number) => void;
  onChangeStatus: (room: Room, status: RoomStatus) => void;
  onDelete: (room: Room) => void;
};

/**
 * Renders the room list: the heading, filters, table, and pager.
 *
 * Presentational: the container supplies its fully resolved view model and every
 * event callback, so this component owns no queries, mutations, or navigation state.
 */
export function RoomsView({
  state,
  meta,
  search,
  status,
  onSearchChange,
  onStatusChange,
  onPageChange,
  onChangeStatus,
  onDelete,
}: RoomsViewProps) {
  const columns: DataTableColumn<Room>[] = [
    {
      key: "name",
      header: "Phòng học",
      cell: (room) => <span className="font-medium">{room.name}</span>,
    },
    {
      key: "capacity",
      header: "Sức chứa",
      className: "w-28",
      cell: (room) => <span className="tabular-nums">{room.capacity} chỗ</span>,
    },
    {
      key: "note",
      header: "Ghi chú",
      hideOnMobile: true,
      cell: (room) => <span className="text-muted-foreground">{room.note ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      className: "w-32",
      cell: (room) => (
        <Badge variant={room.status === 0 ? "default" : "secondary"}>
          {ROOM_STATUS_LABELS[room.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      className: "w-12",
      cell: (room) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Thao tác với phòng ${room.name}`}
            >
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/academic/rooms/${room.id}`}>Sửa phòng học</Link>
            </DropdownMenuItem>
            {ROOM_STATUSES.filter((next) => next !== room.status).map((next) => (
              <DropdownMenuItem key={next} onSelect={() => onChangeStatus(room, next)}>
                Đặt {ROOM_STATUS_LABELS[next].toLocaleLowerCase("vi-VN")}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(room)}>
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const hasQuery = search !== "" || status !== undefined;

  // Nothing has ever been added yet, and no search or filter is even in play — the
  // toolbar and table would only frame an empty table, so the empty state takes
  // over the whole screen instead of sitting inside it.
  if (state.kind === "empty" && !hasQuery) {
    return (
      <EmptyState
        title="Chưa có phòng học nào."
        description="Thêm phòng học đầu tiên để xếp lịch."
        image="/images/empty_1.png"
        action={
          <Button asChild size="sm">
            <Link href="/academic/rooms/new">
              <Plus aria-hidden="true" />
              Thêm phòng học
            </Link>
          </Button>
        }
        className="min-h-[50svh] content-center"
      />
    );
  }

  // Past that point, an empty result means the current search or filter rules
  // everything out — the toolbar stays, since clearing a condition is the way out.
  const listState: DataTableState<Room> =
    state.kind === "empty"
      ? {
          kind: "empty",
          message: "Không tìm thấy phòng học nào khớp.",
          description: "Thử đổi từ khóa hoặc bỏ bộ lọc trạng thái.",
          image: "/images/empty_2.png",
          action: (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onSearchChange("");
                onStatusChange(undefined);
              }}
            >
              Xóa điều kiện
            </Button>
          ),
        }
      : state;

  return (
    <div className="grid gap-6">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/academic/rooms/new">
            <Plus aria-hidden="true" />
            Thêm phòng học
          </Link>
        </Button>
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchLabel="Tìm kiếm"
        searchPlaceholder="Tên phòng học"
        filters={
          <SelectField
            name="room-status-filter"
            label="Trạng thái"
            value={status ?? ALL_STATUSES}
            choices={STATUS_FILTER_CHOICES}
            onChange={(value) => onStatusChange(value === ALL_STATUSES ? undefined : value as RoomStatus)}
          />
        }
      />

      <DataTable columns={columns} state={listState} rowKey={(room) => room.id} />

      <DataTablePagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}
