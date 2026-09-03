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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PageMeta } from "@/lib/api/contracts";

import type { Subject } from "../types/academic";

/** What the subject list screen renders and reports back. */
export type SubjectsViewProps = {
  state: DataTableState<Subject>;
  meta: PageMeta;
  search: string;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onToggleActive: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
};

/**
 * Renders the subject list: the heading, the search box, the table, and the pager.
 *
 * Each row carries how many running classes teach the subject, because that count
 * is exactly what decides whether it can be locked, and showing it here saves the
 * reader from finding out by being refused.
 *
 * Presentational: it holds no query, mutation, or navigation state of its own.
 */
export function SubjectsView({
  state,
  meta,
  search,
  onSearchChange,
  onPageChange,
  onToggleActive,
  onDelete,
}: SubjectsViewProps) {
  const columns: DataTableColumn<Subject>[] = [
    {
      key: "name",
      header: "Tên môn học",
      cell: (subject) => <span className="font-medium">{subject.name}</span>,
    },
    {
      key: "description",
      header: "Mô tả",
      hideOnMobile: true,
      cell: (subject) => (
        <span className="text-muted-foreground">{subject.description ?? "—"}</span>
      ),
    },
    {
      key: "classes",
      header: "Lớp đang hoạt động",
      hideOnMobile: true,
      className: "w-44",
      cell: (subject) => <span>{subject.active_classes_count ?? 0} lớp</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      className: "w-36",
      cell: (subject) => (
        <Badge variant={subject.is_active ? "default" : "secondary"}>
          {subject.is_active ? "Đang mở" : "Đã khóa"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      className: "w-12",
      cell: (subject) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Thao tác với ${subject.name}`}>
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/academic/subjects/${subject.id}`}>Sửa</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onToggleActive(subject)}>
              {subject.is_active ? "Khóa môn học" : "Mở môn học"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(subject)}>
              Xóa
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
        title="Chưa có môn học nào."
        description="Thêm môn học đầu tiên để mở lớp."
        image="/images/empty_1.png"
        action={
          <Button asChild size="sm">
            <Link href="/academic/subjects/new">
              <Plus aria-hidden="true" />
              Thêm môn học
            </Link>
          </Button>
        }
        className="min-h-[50svh] content-center"
      />
    );
  }

  // Past that point, an empty result means the current search rules everything
  // out — the toolbar stays, since clearing it is the way out.
  const listState: DataTableState<Subject> =
    state.kind === "empty"
      ? {
          kind: "empty",
          message: "Không tìm thấy môn học nào khớp.",
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
          <Link href="/academic/subjects/new">
            <Plus aria-hidden="true" />
            Thêm môn học
          </Link>
        </Button>
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchLabel="Tìm kiếm"
        searchPlaceholder="Tên môn học"
      />

      <DataTable columns={columns} state={listState} rowKey={(subject) => subject.id} />

      <DataTablePagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}
