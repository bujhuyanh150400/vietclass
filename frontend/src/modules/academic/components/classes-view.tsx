"use client";

import Link from "next/link";
import { MoreHorizontal, Plus } from "lucide-react";

import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  PageHeader,
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

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Lớp học"
        description="Lớp gắn một môn học với một giáo viên phụ trách."
        action={
          <Button asChild>
            <Link href="/academic/classes/new">
              <Plus aria-hidden="true" />
              Thêm lớp học
            </Link>
          </Button>
        }
      />

      <DataTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchLabel="Tìm kiếm"
        searchPlaceholder="Mã lớp hoặc tên lớp"
      />

      <DataTable
        columns={columns}
        state={state}
        rowKey={(schoolClass) => schoolClass.id}
      />

      <DataTablePagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}
