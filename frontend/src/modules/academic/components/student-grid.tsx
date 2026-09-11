"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type { DataTableState } from "@/components/shared/data-table";
import { UserAvatar } from "@/modules/avatar";

import type { Student } from "../types/academic";
import { AccountBadge, GradeToken, StudentRowMenu } from "./student-cells";
import { ClassTags, GuardianTags } from "./student-entity-tags";

/**
 * Renders student records as cards.
 *
 * This is both the chosen card view and what the table falls back to on a narrow
 * screen, so it carries the same facts the table's columns do rather than a
 * reduced set — a reader on a phone is not looking for less.
 *
 * Only the content state reaches here: loading, empty, and failure are drawn once
 * by the sheet, whichever layout is active.
 */
export function StudentGrid({
  state,
  onToggleAccount,
  onChangePassword,
}: {
  state: Extract<DataTableState<Student>, { kind: "content" }>;
  onToggleAccount: (student: Student) => void;
  onChangePassword: (student: Student) => void;
}) {
  return (
    <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
      {state.rows.map((student) => (
        <article
          key={student.id}
          className="min-w-0 rounded-panel border border-vc-rule bg-card p-3.5 transition-shadow hover:border-vc-control hover:shadow-[0_3px_0_var(--vc-shell-rule)] focus-within:border-vc-control"
        >
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5">
            <UserAvatar
              value={student.avatar}
              name={student.full_name}
              alt={`Ảnh đại diện của ${student.full_name}`}
              className="size-[38px]"
            />
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold">
                <Link
                  href={`/academic/students/${student.id}`}
                  className="hover:text-vc-orange-deep focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {student.full_name}
                </Link>
              </h3>
              <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                {student.phone ?? "Chưa có số điện thoại"}
              </p>
            </div>
            <StudentRowMenu
              student={student}
              onToggleAccount={onToggleAccount}
              onChangePassword={onChangePassword}
            />
          </div>

          <div className="my-3 flex items-center gap-2 border-y border-vc-rule py-2.5">
            <GradeToken gradeLevel={student.grade_level} />
            <AccountBadge isActive={student.is_account_active !== false} />
          </div>

          <CardEntityGroup label="Phụ huynh" count={student.guardians.length}>
            <GuardianTags student={student} layout="card" />
          </CardEntityGroup>

          <div className="mt-2.5">
            <CardEntityGroup label="Lớp đang học" count={student.active_enrollments.length}>
              <ClassTags student={student} layout="card" />
            </CardEntityGroup>
          </div>
        </article>
      ))}
    </div>
  );
}

/**
 * Labels one group of related records on a card and states how many there are.
 *
 * The count is printed even though the chips below are visible, because the
 * chips stop at two: without it, a student with five guardians would look like a
 * student with two and a "+3" whose total the reader has to work out.
 */
function CardEntityGroup({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono">{count}</span>
      </div>
      {children}
    </div>
  );
}
