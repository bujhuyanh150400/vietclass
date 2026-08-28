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

import type { Teacher } from "../types/academic";
import { EMPLOYEE_STATUS_LABELS, formatDate } from "../utils/labels";

/** What the teacher list screen renders and reports back. */
export type TeachersViewProps = {
  state: DataTableState<Teacher>;
  meta: PageMeta;
  search: string;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onToggleAccount: (teacher: Teacher) => void;
  onChangePassword: (teacher: Teacher) => void;
};

/**
 * Renders the teacher list: the heading, the search box, the table, and the pager.
 *
 * Employment and account state are shown as two separate columns because they are
 * two separate things: a teacher who has left may still have a working login, and
 * a locked account does not by itself mean the teacher stopped working here.
 *
 * Presentational: it holds no query, mutation, or navigation state of its own.
 */
export function TeachersView({
  state,
  meta,
  search,
  onSearchChange,
  onPageChange,
  onToggleAccount,
  onChangePassword,
}: TeachersViewProps) {
  const columns: DataTableColumn<Teacher>[] = [
    {
      key: "teacher",
      header: "Giáo viên",
      cell: (teacher) => (
        <div className="grid gap-0.5">
          <span className="font-medium">{teacher.full_name}</span>
          <span className="text-xs text-muted-foreground">{teacher.username ?? "—"}</span>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Liên hệ",
      hideOnMobile: true,
      cell: (teacher) => (
        <div className="grid gap-0.5">
          <span>{teacher.phone}</span>
          <span className="text-xs text-muted-foreground">{teacher.email}</span>
        </div>
      ),
    },
    {
      key: "joined_at",
      header: "Ngày vào làm",
      hideOnMobile: true,
      className: "w-36",
      cell: (teacher) => formatDate(teacher.joined_at),
    },
    {
      key: "status",
      header: "Công việc",
      className: "w-36",
      cell: (teacher) => (
        <Badge variant={teacher.status === 0 ? "default" : "secondary"}>
          {EMPLOYEE_STATUS_LABELS[teacher.status]}
        </Badge>
      ),
    },
    {
      key: "account",
      header: "Tài khoản",
      className: "w-32",
      cell: (teacher) => (
        <Badge variant={teacher.is_account_active === false ? "destructive" : "outline"}>
          {teacher.is_account_active === false ? "Đã khóa" : "Đang mở"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Thao tác</span>,
      className: "w-12",
      cell: (teacher) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Thao tác với ${teacher.full_name}`}
            >
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/academic/teachers/${teacher.id}`}>Sửa hồ sơ</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onChangePassword(teacher)}>
              Đổi mật khẩu
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onToggleAccount(teacher)}>
              {teacher.is_account_active === false ? "Mở tài khoản" : "Khóa tài khoản"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Giáo viên"
        description="Hồ sơ giáo viên và tài khoản đăng nhập đi kèm."
        action={
          <Button asChild>
            <Link href="/academic/teachers/new">
              <Plus aria-hidden="true" />
              Thêm giáo viên
            </Link>
          </Button>
        }
      />

      <DataTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchLabel="Tìm kiếm"
        searchPlaceholder="Tên, số điện thoại, email hoặc tên đăng nhập"
      />

      <DataTable columns={columns} state={state} rowKey={(teacher) => teacher.id} />

      <DataTablePagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}
