"use client";

import { MoreHorizontal, UserPlus } from "lucide-react";

import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  type DataTableColumn,
  type DataTableState,
} from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PageMeta } from "@/lib/api/contracts";

import type { Enrollment } from "../types/academic";
import { formatDate } from "../utils/labels";

/** What the roster renders and reports back. */
export type RosterViewProps = {
  state: DataTableState<Enrollment>;
  meta: PageMeta;
  search: string;
  canModify: boolean;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onAdd: () => void;
  onEdit: (enrollment: Enrollment) => void;
  onTransfer: (enrollment: Enrollment) => void;
  onLeave: (enrollment: Enrollment) => void;
};

/**
 * Renders one class roster, including the periods students have already left.
 *
 * History is shown rather than hidden because a student may leave and return, and
 * the earlier period is what makes the gap in their record explainable.
 *
 * Transferring and ending a membership only apply while a period is running, so
 * those entries are offered only on rows that are.
 *
 * Presentational: it holds no query, mutation, or navigation state of its own.
 */
export function RosterView({
  state,
  meta,
  search,
  canModify,
  onSearchChange,
  onPageChange,
  onAdd,
  onEdit,
  onTransfer,
  onLeave,
}: RosterViewProps) {
  const columns: DataTableColumn<Enrollment>[] = [
    {
      key: "student",
      header: "Học sinh",
      cell: (enrollment) => (
        <span className="font-medium">{enrollment.student_name ?? "—"}</span>
      ),
    },
    {
      key: "period",
      header: "Thời gian học",
      cell: (enrollment) => (
        <span className="text-muted-foreground">
          {formatDate(enrollment.enrolled_at)} –{" "}
          {enrollment.left_at === null ? "Hiện tại" : formatDate(enrollment.left_at)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      className: "w-32",
      cell: (enrollment) => (
        <Badge variant={enrollment.is_active ? "default" : "secondary"}>
          {enrollment.is_active ? "Đang học" : "Đã nghỉ"}
        </Badge>
      ),
    },
    {
      key: "note",
      header: "Ghi chú",
      hideOnMobile: true,
      cell: (enrollment) => (
        <span className="whitespace-pre-line text-muted-foreground">
          {enrollment.note ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      className: "w-12",
      cell: (enrollment) =>
        canModify ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Thao tác với ${enrollment.student_name ?? "học sinh"}`}
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(enrollment)}>
                Sửa ngày gia nhập
              </DropdownMenuItem>
              {enrollment.is_active ? (
                <>
                  <DropdownMenuItem onSelect={() => onTransfer(enrollment)}>
                    Chuyển lớp
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => onLeave(enrollment)}
                  >
                    Cho nghỉ lớp
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ];

  return (
    <div className="grid gap-4">
      <DataTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchLabel="Tìm học sinh trong lớp"
        searchPlaceholder="Tên học sinh"
        action={
          canModify ? (
            <Button onClick={onAdd}>
              <UserPlus aria-hidden="true" />
              Thêm học sinh
            </Button>
          ) : null
        }
      />

      <DataTable columns={columns} state={state} rowKey={(enrollment) => enrollment.id} />

      <DataTablePagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}
