"use client";

import Link from "next/link";
import { MoreHorizontal, Plus } from "lucide-react";

import {
  DataTable,
  DataTablePagination,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PageMeta } from "@/lib/api/contracts";

import type { Student, StudentStatus } from "../types/academic";
import { GRADE_LEVEL_LABELS, STUDENT_STATUS_LABELS } from "../utils/labels";
import { STUDENT_TABLE_PAGE_SIZES, type StudentFilterState, type StudentListSort, type StudentListView } from "../utils/student-list-controls";
import { StudentGrid } from "./student-grid";
import { StudentListToolbar } from "./student-list-toolbar";

/** How each study status is coloured, so the list reads at a glance. */
const STATUS_VARIANT: Record<StudentStatus, "default" | "secondary" | "destructive"> = {
  0: "default",
  1: "secondary",
  2: "destructive",
};

/** What the student list screen renders and reports back. */
export type StudentsViewProps = {
  state: DataTableState<Student>;
  meta: PageMeta;
  search: string;
  filters: StudentFilterState;
  filterCount: number;
  sort: StudentListSort;
  view: StudentListView;
  tablePageSize: number;
  onSearchChange: (value: string) => void;
  onToggleGradeLevel: (gradeLevel: Student["grade_level"]) => void;
  onToggleStatus: (status: StudentStatus) => void;
  onAccountActiveChange: (isActive: boolean | null) => void;
  onClearFilters: () => void;
  onSortChange: (sort: StudentListSort) => void;
  onViewChange: (view: StudentListView) => void;
  onTablePageSizeChange: (pageSize: number) => void;
  onClearConditions: () => void;
  onPageChange: (page: number) => void;
  onToggleAccount: (student: Student) => void;
  onChangePassword: (student: Student) => void;
};

/**
 * Renders the student list: the heading, the search box, the table, and the pager.
 *
 * The guardian sits beside the student rather than on a separate screen, because
 * it is the contact anyone looking up a student actually needs.
 *
 * Presentational: it holds no query, mutation, or navigation state of its own.
 */
export function StudentsView({
  state,
  meta,
  search,
  filters,
  filterCount,
  sort,
  view,
  tablePageSize,
  onSearchChange,
  onToggleGradeLevel,
  onToggleStatus,
  onAccountActiveChange,
  onClearFilters,
  onSortChange,
  onViewChange,
  onTablePageSizeChange,
  onClearConditions,
  onPageChange,
  onToggleAccount,
  onChangePassword,
}: StudentsViewProps) {
  const columns: DataTableColumn<Student>[] = [
    {
      key: "student",
      header: "Học sinh",
      cell: (student) => (
        <div className="grid gap-0.5">
          <span className="font-medium">{student.full_name}</span>
          <span className="text-xs text-muted-foreground">
            {student.phone ?? "Chưa có số điện thoại"}
          </span>
        </div>
      ),
    },
    {
      key: "grade",
      header: "Khối",
      className: "w-36",
      cell: (student) => GRADE_LEVEL_LABELS[student.grade_level],
    },
    {
      key: "guardian",
      header: "Phụ huynh",
      hideOnMobile: true,
      cell: (student) => (
        <div className="grid gap-0.5">
          <span>{student.guardian_name ?? "—"}</span>
          <span className="text-xs text-muted-foreground">{student.guardian_phone ?? "—"}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Học tập",
      className: "w-32",
      cell: (student) => (
        <Badge variant={STATUS_VARIANT[student.status]}>
          {STUDENT_STATUS_LABELS[student.status]}
        </Badge>
      ),
    },
    {
      key: "account",
      header: "Tài khoản",
      className: "w-32",
      cell: (student) => (
        <Badge variant={student.is_account_active === false ? "destructive" : "outline"}>
          {student.is_account_active === false ? "Đã khóa" : "Đang mở"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      className: "w-12",
      cell: (student) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Thao tác với ${student.full_name}`}
            >
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/academic/students/${student.id}`}>Sửa hồ sơ</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onChangePassword(student)}>
              Đổi mật khẩu
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onToggleAccount(student)}>
              {student.is_account_active === false ? "Mở tài khoản" : "Khóa tài khoản"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const hasQuery = search !== "" || filterCount > 0;

  // Nothing has ever been added yet, and no search or filter is even in play — the
  // toolbar and table would only frame an empty table, so the empty state takes
  // over the whole screen instead of sitting inside it.
  if (state.kind === "empty" && !hasQuery) {
    return (
      <EmptyState
        title="Chưa có học sinh nào."
        description="Thêm học sinh đầu tiên để bắt đầu quản lý lớp học."
        image="/images/empty_1.png"
        action={
          <Button asChild size="sm">
            <Link href="/academic/students/new">
              <Plus aria-hidden="true" />
              Thêm học sinh
            </Link>
          </Button>
        }
        className="min-h-[50svh] content-center"
      />
    );
  }

  // Past that point, an empty result means the current search or filters rule
  // everything out — the toolbar stays, since clearing a condition is the way out.
  const listState: DataTableState<Student> =
    state.kind === "empty"
      ? {
          kind: "empty",
          message: "Không tìm thấy học sinh nào khớp.",
          description: "Thử đổi từ khóa hoặc bỏ bớt điều kiện đang áp dụng.",
          image: "/images/empty_2.png",
          action: (
            <Button type="button" variant="outline" size="sm" onClick={onClearConditions}>
              Xóa điều kiện
            </Button>
          ),
        }
      : state;

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/academic/students/new">
            <Plus aria-hidden="true" />
            Thêm học sinh
          </Link>
        </Button>
      </div>

      <StudentListToolbar
        search={search}
        onSearchChange={onSearchChange}
        filters={filters}
        filterCount={filterCount}
        sort={sort}
        view={view}
        onToggleGradeLevel={onToggleGradeLevel}
        onToggleStatus={onToggleStatus}
        onAccountActiveChange={onAccountActiveChange}
        onClearFilters={onClearFilters}
        onSortChange={onSortChange}
        onViewChange={onViewChange}
        onClearConditions={onClearConditions}
      />

      {view === "table" ? (
        <DataTable columns={columns} state={listState} rowKey={(student) => student.id} />
      ) : (
        <StudentGrid state={listState} onToggleAccount={onToggleAccount} onChangePassword={onChangePassword} />
      )}

      <div className="grid gap-3">
        {view === "table" ? (
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>Hiển thị</span>
            <Select value={String(tablePageSize)} onValueChange={(value) => onTablePageSizeChange(Number(value))}>
              <SelectTrigger size="sm" className="w-[76px]"><SelectValue /></SelectTrigger>
              <SelectContent align="end">
                {STUDENT_TABLE_PAGE_SIZES.map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>{pageSize}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>mục / trang</span>
          </div>
        ) : null}
        <DataTablePagination meta={meta} onPageChange={onPageChange} />
      </div>
    </div>
  );
}
