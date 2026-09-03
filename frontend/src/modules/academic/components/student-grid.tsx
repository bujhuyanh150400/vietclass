"use client";

import Link from "next/link";
import { MoreHorizontal, Phone, UserRound } from "lucide-react";

import { EmptyState, type DataTableState } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import type { Student, StudentStatus } from "../types/academic";
import { GRADE_LEVEL_LABELS, STUDENT_STATUS_LABELS } from "../utils/labels";

/** How each study status is coloured in a student card. */
const STATUS_VARIANT: Record<StudentStatus, "default" | "secondary" | "destructive"> = {
  0: "default",
  1: "secondary",
  2: "destructive",
};

/** Returns a compact fallback avatar label from a student's name. */
function initials(name: string): string {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();
}

/** Renders student records as compact cards while preserving list states and actions. */
export function StudentGrid({
  state,
  onToggleAccount,
  onChangePassword,
}: {
  state: DataTableState<Student>;
  onToggleAccount: (student: Student) => void;
  onChangePassword: (student: Student) => void;
}) {
  if (state.kind === "loading") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Đang tải học sinh">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-48 animate-pulse rounded-xl border bg-muted/40" />
        ))}
      </div>
    );
  }

  if (state.kind === "error") {
    return <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-sm text-destructive">{state.message}</div>;
  }

  if (state.kind === "empty") {
    return (
      <EmptyState
        title={state.message}
        description={state.description}
        icon={state.icon}
        image={state.image}
        action={state.action}
        className="rounded-xl border border-dashed py-16"
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {state.rows.map((student) => (
        <article key={student.id} className="rounded-xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-50 text-xs font-semibold text-vc-orange-deep">
              {initials(student.full_name)}
            </div>
            <div className="min-w-0 grow">
              <Link href={`/academic/students/${student.id}`} className="block truncate text-sm font-semibold hover:text-vc-orange-deep">
                {student.full_name}
              </Link>
              <p className="truncate text-xs text-muted-foreground">@{student.username ?? "chưa-có-tài-khoản"}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Thao tác với ${student.full_name}`}>
                  <MoreHorizontal aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild><Link href={`/academic/students/${student.id}`}>Sửa hồ sơ</Link></DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onChangePassword(student)}>Đổi mật khẩu</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onToggleAccount(student)}>
                  {student.is_account_active === false ? "Mở tài khoản" : "Khóa tài khoản"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-4 grid gap-2 border-y py-3 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Khối</span>
              <span className="font-medium">{GRADE_LEVEL_LABELS[student.grade_level]}</span>
            </div>
            <div className="flex min-w-0 items-center justify-between gap-3">
              <span className="flex items-center gap-1 text-muted-foreground"><UserRound aria-hidden="true" className="size-3.5" />Phụ huynh</span>
              <span className="truncate">{student.guardian_name ?? "—"}</span>
            </div>
            <div className="flex min-w-0 items-center justify-between gap-3">
              <span className="flex items-center gap-1 text-muted-foreground"><Phone aria-hidden="true" className="size-3.5" />Liên hệ</span>
              <span className="truncate">{student.guardian_phone ?? student.phone ?? "—"}</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge variant={STATUS_VARIANT[student.status]}>{STUDENT_STATUS_LABELS[student.status]}</Badge>
            <Badge variant={student.is_account_active === false ? "destructive" : "outline"}>
              {student.is_account_active === false ? "Đã khóa" : "Đang mở"}
            </Badge>
          </div>
        </article>
      ))}
    </div>
  );
}
