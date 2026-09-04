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
import { UserAvatar } from "@/modules/avatar";

import type { Teacher } from "../types/academic";
import { TEACHER_STATUS_LABELS, formatDate } from "../utils/labels";

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
        <div className="flex items-center gap-2.5">
          <UserAvatar
            value={teacher.avatar}
            name={teacher.full_name}
            alt={`Ảnh đại diện của ${teacher.full_name}`}
          />
          <div className="grid gap-0.5">
            <span className="font-medium">{teacher.full_name}</span>
            <span className="text-xs text-muted-foreground">{teacher.username ?? "—"}</span>
          </div>
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
          {TEACHER_STATUS_LABELS[teacher.status]}
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

  const hasQuery = search !== "";

  // Nothing has ever been added yet, and no search is even in play — the toolbar
  // and table would only frame an empty table, so the empty state takes over the
  // whole screen instead of sitting inside it.
  if (state.kind === "empty" && !hasQuery) {
    return (
      <EmptyState
        title="Chưa có giáo viên nào."
        description="Thêm giáo viên đầu tiên để phân công lớp."
        image="/images/empty_1.png"
        action={
          <Button asChild size="sm">
            <Link href="/academic/teachers/new">
              <Plus aria-hidden="true" />
              Thêm giáo viên
            </Link>
          </Button>
        }
        className="min-h-[50svh] content-center"
      />
    );
  }

  // Past that point, an empty result means the current search rules everything
  // out — the toolbar stays, since clearing it is the way out.
  const listState: DataTableState<Teacher> =
    state.kind === "empty"
      ? {
          kind: "empty",
          message: "Không tìm thấy giáo viên nào khớp.",
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
          <Link href="/academic/teachers/new">
            <Plus aria-hidden="true" />
            Thêm giáo viên
          </Link>
        </Button>
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchLabel="Tìm kiếm"
        searchPlaceholder="Tên, số điện thoại, email hoặc tên đăng nhập"
      />

      <DataTable columns={columns} state={listState} rowKey={(teacher) => teacher.id} />

      <DataTablePagination meta={meta} onPageChange={onPageChange} />
    </div>
  );
}
