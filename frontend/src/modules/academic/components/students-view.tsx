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

import type { Student, StudentStatus } from "../types/academic";
import { GRADE_LEVEL_LABELS, STUDENT_STATUS_LABELS } from "../utils/labels";

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
  onSearchChange: (value: string) => void;
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
  onSearchChange,
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
      key: "parent",
      header: "Phụ huynh",
      hideOnMobile: true,
      cell: (student) => (
        <div className="grid gap-0.5">
          <span>{student.parent_name}</span>
          <span className="text-xs text-muted-foreground">{student.parent_phone ?? "—"}</span>
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

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Học sinh"
        description="Hồ sơ học sinh, thông tin phụ huynh và tài khoản đăng nhập."
        action={
          <Button asChild>
            <Link href="/academic/students/new">
              <Plus aria-hidden="true" />
              Thêm học sinh
            </Link>
          </Button>
        }
      />

      <DataTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchLabel="Tìm kiếm"
        searchPlaceholder="Tên học sinh, phụ huynh, số điện thoại hoặc tên đăng nhập"
      />

      <DataTable columns={columns} state={state} rowKey={(student) => student.id} />

      <DataTablePagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}
