"use client";

import Link from "next/link";

import type { DataTableState } from "@/components/shared/data-table";

import type { Subject } from "../types/academic";
import { SubjectClassCount, SubjectGradeLevels, SubjectRowMenu, SubjectStatusBadge } from "./subject-cells";

/** Renders subjects as cards for the explicit grid view and narrow screens. */
export function SubjectGrid({
  state,
  onView,
  onToggleActive,
  onDelete,
}: {
  state: Extract<DataTableState<Subject>, { kind: "content" }>;
  onView: (subject: Subject) => void;
  onToggleActive: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
}) {
  return (
    <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
      {state.rows.map((subject) => (
        <article
          key={subject.id}
          className="min-w-0 rounded-panel border border-vc-rule bg-card p-3.5 transition-shadow hover:border-vc-control hover:shadow-[0_3px_0_var(--vc-shell-rule)] focus-within:border-vc-control"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold">
                <Link
                  href={`/academic/subjects/${subject.id}`}
                  className="hover:text-vc-orange-deep focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {subject.name}
                </Link>
              </h3>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                {subject.description ?? "Chưa có mô tả"}
              </p>
            </div>
            <SubjectRowMenu
              subject={subject}
              onView={onView}
              onToggleActive={onToggleActive}
              onDelete={onDelete}
            />
          </div>

          <div className="mt-3.5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-t border-vc-rule pt-3">
            <div className="min-w-0">
              <small className="mb-1.5 block text-[10px] font-semibold text-muted-foreground">
                Khối áp dụng
              </small>
              <SubjectGradeLevels subject={subject} />
            </div>
            <div className="grid justify-items-end gap-3 text-right">
              <div>
                <small className="mb-1 block text-[10px] font-semibold text-muted-foreground">
                  Lớp học
                </small>
                <SubjectClassCount subject={subject} />
              </div>
              <SubjectStatusBadge subject={subject} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
