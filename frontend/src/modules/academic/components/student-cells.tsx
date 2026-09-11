"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/index";
import { UserAvatar } from "@/modules/avatar";

import type { GradeLevel, Student } from "../types/academic";
import { GRADE_LEVEL_LABELS } from "../utils/labels";

/**
 * Renders a student's grade as a fixed-width token rather than as prose.
 *
 * The column holds one or two characters on almost every row, so the number is
 * boxed and set in the mono face: the digits line up down the column and can be
 * compared by eye, which "Lớp 9" spelled out across a wide cell cannot.
 *
 * The pre-primary level has no number to box, so it keeps its words.
 */
export function GradeToken({ gradeLevel }: { gradeLevel: GradeLevel }) {
  const preSchool = gradeLevel === 0;

  return (
    <span
      title={GRADE_LEVEL_LABELS[gradeLevel]}
      className={cn(
        "inline-grid h-8 place-items-center rounded-control border border-vc-control bg-card font-mono text-xs font-semibold",
        preSchool ? "px-2" : "min-w-9",
      )}
    >
      {preSchool ? "Tiền TH" : gradeLevel}
    </span>
  );
}

/**
 * Reports whether a student can still sign in.
 *
 * The wording deliberately describes the login account only. Whether a student
 * is still studying is a separate field on their profile, and a badge that
 * blurred the two would make a locked account look like a withdrawal.
 */
export function AccountBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-control border px-2 py-1 text-[11px] font-bold whitespace-nowrap",
        isActive
          ? "border-vc-leaf/30 bg-vc-leaf/10 text-vc-leaf"
          : "border-destructive/25 bg-destructive/10 text-destructive",
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {isActive ? "Đang mở" : "Đã khóa"}
    </span>
  );
}

/**
 * Renders the cell a reader scans the list by: the student's face, their name as
 * the link into their profile, and the phone number underneath.
 *
 * The number is set in the mono face so digits align down the column, which is
 * what makes a phone number scannable at all in a list this dense.
 */
export function StudentIdentity({ student }: { student: Student }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <UserAvatar
        value={student.avatar}
        name={student.full_name}
        alt={`Ảnh đại diện của ${student.full_name}`}
      />
      <div className="min-w-0">
        <Link
          href={`/academic/students/${student.id}`}
          className="block truncate text-xs font-medium hover:text-vc-orange-deep focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {student.full_name}
        </Link>
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          {student.phone ?? "Chưa có số điện thoại"}
        </p>
      </div>
    </div>
  );
}

/**
 * Renders the per-student action menu.
 *
 * Shared by the table and the cards so the two layouts cannot drift into
 * offering different actions for the same student.
 */
export function StudentRowMenu({
  student,
  onToggleAccount,
  onChangePassword,
  className,
}: {
  student: Student;
  onToggleAccount: (student: Student) => void;
  onChangePassword: (student: Student) => void;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={className}
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
  );
}
