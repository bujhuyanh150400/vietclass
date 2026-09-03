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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PageMeta } from "@/lib/api/contracts";

import type { SchoolClass } from "../types/academic";
import { CLASS_STATUS_LABELS, GRADE_LEVEL_LABELS, formatDate } from "../utils/labels";

/** What the class list screen renders and reports back. */
export type ClassesViewProps = {
  state: DataTableState<SchoolClass>;
  meta: PageMeta;
  search: string;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onChangeStatus: (schoolClass: SchoolClass) => void;
};

/**
 * Renders the class list: the heading, the search box, the table, and the pager.
 *
 * Each row shows how full the class is against its capacity, because that ratio
 * decides whether more students can be enrolled and is the first thing anyone
 * running a class looks for.
 *
 * Presentational: it holds no query, mutation, or navigation state of its own.
 */
export function ClassesView({
  state,
  meta,
  search,
  onSearchChange,
  onPageChange,
  onChangeStatus,
}: ClassesViewProps) {
  const columns: DataTableColumn<SchoolClass>[] = [
    {
      key: "class",
      header: "Lớp",
      cell: (schoolClass) => (
        <div className="grid gap-0.5">
          <span className="font-medium">{schoolClass.name}</span>
          <span className="text-xs text-muted-foreground">{schoolClass.code}</span>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Môn học",
      hideOnMobile: true,
      cell: (schoolClass) => (
        <div className="grid gap-0.5">
          <span>{schoolClass.subject_name ?? "—"}</span>
          <span className="text-xs text-muted-foreground">
            {GRADE_LEVEL_LABELS[schoolClass.grade_level]}
          </span>
        </div>
      ),
    },
    {
      key: "teacher",
      header: "Giáo viên",
      hideOnMobile: true,
      cell: (schoolClass) => schoolClass.teacher_name ?? "—",
    },
    {
      key: "size",
      header: "Sĩ số",
      className: "w-28",
      cell: (schoolClass) => (
        <span className="tabular-nums">
          {schoolClass.active_students_count ?? 0}/{schoolClass.max_students}
        </span>
      ),
    },
    {
      key: "period",
      header: "Thời gian",
      hideOnMobile: true,
      className: "w-44",
      cell: (schoolClass) => (
        <span className="text-muted-foreground">
          {formatDate(schoolClass.start_at)} – {formatDate(schoolClass.end_at)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      className: "w-36",
      cell: (schoolClass) => (
        <Badge variant={schoolClass.status === 0 ? "default" : "secondary"}>
          {CLASS_STATUS_LABELS[schoolClass.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      className: "w-12",
      cell: (schoolClass) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Thao tác với lớp ${schoolClass.name}`}
            >
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/academic/classes/${schoolClass.id}`}>
                Xem lớp và học sinh
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/academic/classes/${schoolClass.id}/edit`}>Sửa lớp</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onChangeStatus(schoolClass)}>
              {schoolClass.status === 0 ? "Kết thúc lớp" : "Mở lại lớp"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const hasQuery = search !== "";

  // Nothing has ever been added yet, and no search is even in play — the toolbar
  // and table would only frame an empty table, so the empty state takes over the
  // whole screen instead of sitting inside it.
  if (state.kind === "empty" && !hasQuery) {
    return (
      <EmptyState
        title="Chưa có lớp học nào."
        description="Thêm lớp học đầu tiên để bắt đầu mở lớp."
        image="/images/empty_1.png"
        action={
          <Button asChild size="sm">
            <Link href="/academic/classes/new">
              <Plus aria-hidden="true" />
              Thêm lớp học
            </Link>
          </Button>
        }
        className="min-h-[50svh] content-center"
      />
    );
  }

  // Past that point, an empty result means the current search rules everything
  // out — the toolbar stays, since clearing it is the way out.
  const listState: DataTableState<SchoolClass> =
    state.kind === "empty"
      ? {
          kind: "empty",
          message: "Không tìm thấy lớp học nào khớp.",
          description: "Thử đổi từ khóa tìm kiếm.",
          image: "/images/empty_2.png",
          action: (
            <Button type="button" variant="outline" size="sm" onClick={() => onSearchChange("")}>
              Xóa tìm kiếm
            </Button>
          ),
        }
      : state;

  return (
    <div className="grid gap-6">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/academic/classes/new">
            <Plus aria-hidden="true" />
            Thêm lớp học
          </Link>
        </Button>
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchLabel="Tìm kiếm"
        searchPlaceholder="Mã lớp hoặc tên lớp"
      />

      <DataTable
        columns={columns}
        state={listState}
        rowKey={(schoolClass) => schoolClass.id}
      />

      <DataTablePagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}
