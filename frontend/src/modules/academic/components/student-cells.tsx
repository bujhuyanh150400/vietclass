"use client";

import Link from "next/link";
import { Eye, KeyRound, Lock, LockOpen, Pencil } from "lucide-react";

import { RowActionMenu, type RowAction } from "@/components/shared/data-table";
import { cn } from "@/lib/utils/index";
import { UserAvatar } from "./user-avatar";

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
 * Renders one labelled fact under a student's name.
 *
 * The label sits in a fixed column so the values line up with each other down
 * the cell; without it "SĐT" and "Mã học sinh" would push their numbers to
 * different offsets and the pair would read as two unrelated lines.
 */
function IdentityMeta({ label, value }: { label: string; value: string }) {
  return (
    <span className="grid grid-cols-[62px_minmax(0,1fr)] gap-1.5 text-[10px] leading-[1.45]">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-mono text-foreground">{value}</span>
    </span>
  );
}

/**
 * Renders the cell a reader scans the list by: the student's face, their name as
 * the link into their profile, and the two facts used to tell one student from
 * another with the same name — the phone number and the student code.
 *
 * The code is the profile id printed as it is. There is no separate code column
 * on `student_profiles`, and inventing a prefixed format here would put a second
 * identifier in front of readers that nothing else in the system answers to.
 *
 * Both are set in the mono face so digits align down the column, which is what
 * makes them scannable at all in a list this dense.
 */
export function StudentIdentity({ student }: { student: Student }) {
  return (
    <div className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)] items-center gap-3">
      <Link
        href={`/academic/students/${student.id}`}
        aria-label={`Xem hồ sơ của ${student.full_name}`}
        className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <UserAvatar
          value={student.avatar}
          name={student.full_name}
          alt={`Ảnh đại diện của ${student.full_name}`}
          className="size-11 border border-vc-control bg-background"
        />
      </Link>
      <div className="grid min-w-0 gap-0.5">
        <Link
          href={`/academic/students/${student.id}`}
          className="block truncate text-xs font-medium hover:text-vc-orange-deep focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {student.full_name}
        </Link>
        <IdentityMeta label="SĐT" value={student.phone ?? "Chưa có"} />
        <IdentityMeta label="Mã học sinh" value={String(student.id)} />
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
  canUpdate,
  canToggleAccount,
  className,
}: {
  student: Student;
  onToggleAccount: (student: Student) => void;
  onChangePassword: (student: Student) => void;
  canUpdate: boolean;
  canToggleAccount: boolean;
  className?: string;
}) {
  const hasAccount = typeof student.user_id === "number" && student.user_id > 0;
  const actions: RowAction[] = [
    {
      key: "view",
      label: "Xem hồ sơ",
      icon: <Eye aria-hidden="true" className="text-foreground" />,
      href: `/academic/students/${student.id}`,
    },
    ...(canUpdate
      ? [
          {
            key: "edit",
            label: "Sửa hồ sơ",
            icon: <Pencil aria-hidden="true" className="text-foreground" />,
            href: `/academic/students/${student.id}/edit`,
          } satisfies RowAction,
        ]
      : []),
    ...(hasAccount && canUpdate
      ? [
          {
            key: "password",
            label: "Đổi mật khẩu",
            icon: <KeyRound aria-hidden="true" className="text-foreground" />,
            onSelect: () => onChangePassword(student),
          } satisfies RowAction,
        ]
      : []),
    ...(hasAccount && canToggleAccount
      ? [
          {
            key: "account",
            label: student.is_account_active === false ? "Mở tài khoản" : "Khóa tài khoản",
            icon: student.is_account_active === false ? (
              <LockOpen aria-hidden="true" className="text-foreground" />
            ) : (
              <Lock aria-hidden="true" className="text-foreground" />
            ),
            onSelect: () => onToggleAccount(student),
          } satisfies RowAction,
        ]
      : []),
  ];

  return (
    <RowActionMenu
      actions={actions}
      triggerLabel={`Thao tác với ${student.full_name}`}
      triggerClassName={className}
    />
  );
}
