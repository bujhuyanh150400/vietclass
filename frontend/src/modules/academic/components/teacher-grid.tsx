"use client";

import type { ReactNode } from "react";

import type { DataTableState } from "@/components/shared/data-table";

import type { Teacher } from "../types/academic";
import {
  TeacherAccountBadge,
  TeacherClasses,
  TeacherContact,
  TeacherJoinedDate,
  TeacherRowMenu,
  TeacherSubjects,
} from "./teacher-cells";
import { UserAvatar } from "./user-avatar";

/** Renders teachers as cards for the explicit grid view and narrow screens. */
export function TeacherGrid({
  state,
  onView,
  onToggleAccount,
  onChangePassword,
}: {
  state: Extract<DataTableState<Teacher>, { kind: "content" }>;
  onView: (teacher: Teacher) => void;
  onToggleAccount: (teacher: Teacher) => void;
  onChangePassword: (teacher: Teacher) => void;
}) {
  return (
    <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
      {state.rows.map((teacher) => (
        <article
          key={teacher.id}
          className="min-w-0 rounded-panel border border-vc-rule bg-card p-3.5 transition-shadow hover:border-vc-control hover:shadow-[0_3px_0_var(--vc-shell-rule)] focus-within:border-vc-control"
        >
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5">
            <UserAvatar
              value={teacher.avatar}
              name={teacher.full_name}
              alt={`Ảnh đại diện của ${teacher.full_name}`}
              className="size-[38px]"
            />
            <button
              type="button"
              onClick={() => onView(teacher)}
              className="min-w-0 text-left hover:text-vc-orange-deep focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <h3 className="truncate text-[15px] font-semibold">{teacher.full_name}</h3>
              <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                Mã hồ sơ #{teacher.id}
              </p>
            </button>
            <TeacherRowMenu
              teacher={teacher}
              onView={onView}
              onToggleAccount={onToggleAccount}
              onChangePassword={onChangePassword}
            />
          </div>

          <div className="my-3 grid gap-2 border-y border-vc-rule py-2.5">
            <TeacherContact teacher={teacher} />
            <div className="flex items-center justify-between gap-2">
              <TeacherJoinedDate teacher={teacher} />
              <TeacherAccountBadge teacher={teacher} />
            </div>
          </div>

          <CardEntityGroup label="Bộ môn" count={teacher.subjects.length}>
            <TeacherSubjects teacher={teacher} limit={2} />
          </CardEntityGroup>

          <div className="mt-2.5">
            <CardEntityGroup label="Lớp phụ trách" count={teacher.classes.length}>
              <TeacherClasses teacher={teacher} limit={2} />
            </CardEntityGroup>
          </div>
        </article>
      ))}
    </div>
  );
}

/** Labels a related-record group and keeps its total visible beside the chips. */
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
