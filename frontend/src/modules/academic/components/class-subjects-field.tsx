"use client";

import { useId, useState } from "react";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { useSubjectPickerOptions } from "../hooks/use-subjects";
import type { ClassSubject, GradeLevel } from "../types/academic";
import { GRADE_LEVEL_LABELS } from "../utils/labels";
import { subjectDisabledReason } from "../utils/eligibility-reasons";
import { choosePrimaryClassSubject, toggleClassSubject } from "../utils/class-form-assignments";

type SubjectPickerRow = Pick<ClassSubject, "id" | "name" | "is_active" | "grade_levels">;

/** Search, select, and set the primary subject without offering invalid additions. */
export function ClassSubjectsField({
  gradeLevel,
  selectedIds,
  primaryId,
  currentSubjects,
  error,
  onChange,
  onSubjectLabel,
}: {
  gradeLevel: GradeLevel | null;
  selectedIds: number[];
  primaryId: number;
  currentSubjects: ClassSubject[];
  error?: string;
  onChange: (subjectIds: number[], primarySubjectId: number) => void;
  onSubjectLabel: (id: number, name: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [knownSubjects, setKnownSubjects] = useState<Record<number, SubjectPickerRow>>(() =>
    Object.fromEntries(currentSubjects.map((subject) => [subject.id, subject])),
  );
  const radioName = useId();
  const query = useSubjectPickerOptions(search, page);
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const incompatibleIds = selectedIds.filter((id) => {
    const subject = knownSubjects[id];

    return gradeLevel !== null && subject !== undefined && !subject.grade_levels.includes(gradeLevel);
  });
  const selectedLabels = selectedIds
    .map((id) => knownSubjects[id]?.name)
    .filter((name): name is string => name !== undefined);

  /** Toggle a subject and keep the representative id inside the full selection. */
  function toggle(subject: SubjectPickerRow): void {
    const selected = selectedIds.includes(subject.id);
    const reason = subjectDisabledReason(subject.is_active, subject.grade_levels, gradeLevel);
    if (reason !== null && !selected) return;

    setKnownSubjects((known) => ({ ...known, [subject.id]: subject }));
    onSubjectLabel(subject.id, subject.name);
    const next = toggleClassSubject(selectedIds, primaryId, subject.id);
    onChange(next.subjectIds, next.primarySubjectId);
  }

  return (
    <Field
      name="subject_ids"
      label="Môn học của lớp"
      required
      hint="Chọn toàn bộ môn học; mỗi lớp cần đúng một môn chính."
      error={error}
    >
      <div className="grid gap-3">
        <Input
          id="class-subject-search"
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          size="control"
          placeholder="Tìm tên môn học…"
          aria-label="Tìm môn học"
        />

        {gradeLevel === null || incompatibleIds.length === 0 ? null : (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-vc-control bg-vc-tint px-3 py-2 text-xs text-muted-foreground" role="status">
            <span>{incompatibleIds.length} môn đã chọn không áp dụng cho {GRADE_LEVEL_LABELS[gradeLevel]}.</span>
            <Button type="button" size="sm" variant="outline" onClick={() => {
              const nextIds = selectedIds.filter((id) => !incompatibleIds.includes(id));
              onChange(nextIds, choosePrimaryClassSubject(nextIds, primaryId));
            }}>
              Bỏ môn không áp dụng
            </Button>
          </div>
        )}

        <div className="max-h-72 overflow-y-auto rounded-panel border border-vc-rule bg-background p-3">
          {query.isPending ? (
            <div className="grid gap-3 p-4" aria-label="Đang tải môn học">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : query.isError ? (
            <div className="grid justify-items-center gap-2 p-5 text-center text-sm">
              <p role="alert">Không tải được danh sách môn học.</p>
              <Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>
                Thử lại
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <p className="p-5 text-center text-sm text-muted-foreground">
              Không tìm thấy môn học phù hợp.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((subject) => {
                const checked = selectedIds.includes(subject.id);
                const reason = subjectDisabledReason(subject.is_active, subject.grade_levels, gradeLevel);
                const disabled = reason !== null && !checked;

                return (
                  <li
                    key={subject.id}
                    className={`grid min-h-16 min-w-0 grid-cols-[18px_minmax(0,1fr)] items-start gap-x-2.5 gap-y-2 rounded-control border border-vc-control bg-card p-3 has-[:checked]:border-foreground has-[:checked]:bg-vc-tint ${disabled ? "opacity-60" : "hover:bg-vc-tint"}`}
                  >
                    <Checkbox
                      id={`class-subject-${subject.id}`}
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={() => toggle(subject)}
                      aria-describedby={`class-subject-meta-${subject.id}`}
                    />
                    <label
                      htmlFor={`class-subject-${subject.id}`}
                      className={`grid min-w-0 flex-1 gap-1 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                    >
                      <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {subject.name}
                        {!subject.is_active ? <span className="text-[10px] text-destructive">Đã khóa</span> : null}
                      </span>
                      <span id={`class-subject-meta-${subject.id}`} className="text-xs text-muted-foreground">
                        {subject.grade_levels.map((grade) => GRADE_LEVEL_LABELS[grade]).join(" · ")}
                        {reason === null ? "" : ` · ${reason}`}
                      </span>
                    </label>
                    <label className="col-start-2 flex w-fit items-center gap-1.5 pt-0.5 text-[11px] text-muted-foreground">
                      <input
                        type="radio"
                        name={radioName}
                        value={subject.id}
                        checked={primaryId === subject.id}
                        disabled={!checked}
                        onChange={() => {
                          setKnownSubjects((known) => ({ ...known, [subject.id]: subject }));
                          onChange(selectedIds, choosePrimaryClassSubject(selectedIds, subject.id));
                        }}
                        aria-label={`Đặt ${subject.name} làm môn chính`}
                        className="accent-vc-ink focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      Chính
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {meta !== undefined && meta.last_page > 1 ? (
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Trang {meta.current_page} / {meta.last_page}</span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1 || query.isFetching} onClick={() => setPage((current) => current - 1)}>
                Trước
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={page >= meta.last_page || query.isFetching} onClick={() => setPage((current) => current + 1)}>
                Sau
              </Button>
            </div>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground" aria-live="polite">
          Đã chọn {selectedIds.length} môn{selectedLabels.length > 0 ? `: ${selectedLabels.join(", ")}` : ""}.
        </p>
      </div>
    </Field>
  );
}
