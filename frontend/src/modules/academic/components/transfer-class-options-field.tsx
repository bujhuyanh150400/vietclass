"use client";

import { useState } from "react";

import { Field } from "@/components/shared/field";
import { InlineBadge } from "@/components/shared/inline-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { useTransferOptions } from "../hooks/use-enrollments";
import type { TransferClassOption } from "../types/academic";
import { GRADE_LEVEL_LABELS } from "../utils/labels";
import { transferDisabledReason } from "../utils/eligibility-reasons";

/** Search destinations and explain why an ineligible class cannot be selected. */
export function TransferClassOptionsField({
  enrollmentId,
  selectedId,
  error,
  onChange,
}: {
  enrollmentId: number;
  selectedId: number;
  error?: string;
  onChange: (classId: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useTransferOptions(enrollmentId, search, page);
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <Field name="class_id" label="Lớp đích" required hint="Chỉ lớp cùng khối, cùng toàn bộ môn học và còn chỗ mới nhận được học sinh." error={error}>
      <div className="grid gap-3">
        <Input
          id="transfer-class-search"
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          size="control"
          placeholder="Tìm tên hoặc mã lớp…"
          aria-label="Tìm lớp đích"
        />

        <div className="max-h-72 overflow-y-auto rounded-panel border border-vc-rule bg-background">
          {query.isPending ? (
            <div className="grid gap-3 p-4" aria-label="Đang tải lớp đích">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-2/3" />
            </div>
          ) : query.isError ? (
            <div className="grid justify-items-center gap-2 p-5 text-center text-sm">
              <p role="alert">Không tải được danh sách lớp đích.</p>
              <Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>
                Thử lại
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <p className="p-5 text-center text-sm text-muted-foreground">
              Không tìm thấy lớp học phù hợp.
            </p>
          ) : (
            <ul className="divide-y divide-vc-rule">
              {rows.map((schoolClass) => (
                <TransferTargetRow
                  key={schoolClass.id}
                  schoolClass={schoolClass}
                  selected={selectedId === schoolClass.id}
                  onSelect={onChange}
                />
              ))}
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
      </div>
    </Field>
  );
}

/** One destination with its grade, complete subject set, capacity, and team lead. */
function TransferTargetRow({
  schoolClass,
  selected,
  onSelect,
}: {
  schoolClass: TransferClassOption;
  selected: boolean;
  onSelect: (classId: number) => void;
}) {
  const disabledReason = schoolClass.disabled_reason;
  const disabled = !schoolClass.is_eligible;
  const subjects = schoolClass.subjects
    .map((subject) => `${subject.name}${subject.is_primary ? " (chính)" : ""}`)
    .join(" · ");

  return (
    <li className="grid gap-2 px-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start sm:px-4">
      <input
        id={`transfer-target-${schoolClass.id}`}
        type="radio"
        name="transfer-target-class"
        value={schoolClass.id}
        checked={selected}
        disabled={disabled}
        onChange={() => onSelect(schoolClass.id)}
        aria-label={`Chọn lớp ${schoolClass.name}`}
        className="mt-1 size-4 accent-vc-ink focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed sm:mt-0.5"
      />
      <label htmlFor={`transfer-target-${schoolClass.id}`} className={`grid min-w-0 gap-1 ${disabled ? "cursor-not-allowed opacity-65" : "cursor-pointer"}`}>
        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {schoolClass.name}
          <span className="font-mono text-[11px] text-muted-foreground">{schoolClass.code}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {GRADE_LEVEL_LABELS[schoolClass.grade_level]} · {subjects || "Chưa gán môn học"}
        </span>
        <span className="text-xs text-muted-foreground">
          Phụ trách: {schoolClass.teacher?.name ?? "Chưa phân công"} · {schoolClass.current_student_count}/{schoolClass.max_students} học sinh
        </span>
        {disabledReason === null ? null : (
          <span className="text-xs font-medium text-destructive" role="note">
            {transferDisabledReason(disabledReason)}
          </span>
        )}
      </label>
      <InlineBadge
        type={schoolClass.is_eligible ? "success" : "muted"}
        className="w-fit font-sans text-[10px] font-semibold"
      >
        {schoolClass.is_eligible ? "Có thể chuyển" : "Không thể chọn"}
      </InlineBadge>
    </li>
  );
}
