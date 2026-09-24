"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { DateField } from "@/components/shared/date-field";
import { Field } from "@/components/shared/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/shared/toast-provider";
import { isApiClientError } from "@/lib/api/api-client-error";

import { useEnrolStudents, useEnrollmentStudentOptions } from "../hooks/use-enrollments";
import { enrollmentStudentDisabledReason } from "../utils/eligibility-reasons";
import { GRADE_LEVEL_LABELS, STUDENT_STATUS_LABELS } from "../utils/labels";

/** Today, as the API writes dates, used as the default join date. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Picks students to add to one class, all joining from the same date.
 *
 * The paginated picker keeps ineligible candidates visible with the exact reason;
 * only eligible students can be selected, and the server rechecks the whole batch
 * against hard capacity before creating any enrollment periods.
 */
export function AddStudentsDialog({
  classId,
  open,
  onOpenChange,
  capacityHint,
}: {
  classId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capacityHint: string;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [enrolledAt, setEnrolledAt] = useState(today());
  const [error, setError] = useState<string | null>(null);
  const eligibilityById = useRef<Record<number, boolean>>({});

  const available = useEnrollmentStudentOptions(classId, search, page);
  const enrol = useEnrolStudents(classId);
  const showToast = useToast();

  /** Adds or removes one student from the selection. */
  function toggle(studentId: number, eligible: boolean) {
    eligibilityById.current[studentId] = eligible;
    setSelected((current) => {
      if (current.includes(studentId)) return current.filter((id) => id !== studentId);
      return eligible ? [...current, studentId] : current;
    });
  }

  /** Clears everything so the next opening starts fresh. */
  function reset() {
    setSearch("");
    setPage(1);
    setSelected([]);
    setEnrolledAt(today());
    setError(null);
  }

  /** Sends the selection and closes only once the API accepts the whole batch. */
  async function submit() {
    setError(null);

    try {
      const eligibleSelection = selected.filter((id) => eligibilityById.current[id] === true);
      if (eligibleSelection.length !== selected.length) {
        setSelected(eligibleSelection);
        setError("Điều kiện ghi danh đã thay đổi. Kiểm tra lại danh sách và chọn học sinh còn đủ điều kiện.");
        return;
      }
      const added = eligibleSelection.length;

      await enrol.mutateAsync({ student_ids: eligibleSelection, enrolled_at: enrolledAt });

      showToast({ variant: "success", title: `Đã thêm ${added} học sinh vào lớp.` });
      reset();
      onOpenChange(false);
    } catch (caught) {
      setError(
        isApiClientError(caught) ? caught.message : "Không thêm được học sinh vào lớp.",
      );
    }
  }

  const rows = useMemo(() => available.data?.data ?? [], [available.data?.data]);
  const meta = available.data?.meta;

  useEffect(() => {
    for (const student of rows) {
      eligibilityById.current[student.id] = student.is_eligible;
    }
  }, [rows]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
        }

        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm học sinh vào lớp</DialogTitle>
          <DialogDescription>{capacityHint}</DialogDescription>
        </DialogHeader>

        {error === null ? null : (
          <Alert variant="destructive" aria-live="polite">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="student-search" label="Tìm học sinh">
              <Input
                id="student-search"
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                size="control"
                placeholder="Tên hoặc số điện thoại"
              />
            </Field>

            <DateField
              name="enrolled-at"
              label="Ngày vào lớp"
              required
              hint="Không được trước ngày khai giảng."
              value={enrolledAt}
              onChange={setEnrolledAt}
              size="control"
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-panel border border-vc-rule bg-background">
            {available.isPending ? (
              <div aria-label="Đang tải học sinh" className="grid gap-3 p-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-2/3" />
              </div>
            ) : available.isError ? (
              <div className="grid justify-items-center gap-2 p-5 text-center text-sm">
                <p role="alert">Không tải được danh sách học sinh.</p>
                <Button type="button" size="sm" variant="outline" onClick={() => void available.refetch()}>
                  Thử lại
                </Button>
              </div>
            ) : rows.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Không tìm thấy học sinh phù hợp.
              </p>
            ) : (
              <ul className="divide-y divide-vc-rule">
                {rows.map((student) => {
                  const disabledReason = student.disabled_reason;
                  const disabled = !student.is_eligible;

                  return (
                    <li key={student.id} className={`flex items-start gap-3 px-4 py-3 ${disabled ? "bg-vc-tint/40" : ""}`}>
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={selected.includes(student.id)}
                        disabled={disabled}
                        onCheckedChange={() => toggle(student.id, student.is_eligible)}
                        aria-describedby={disabled && disabledReason ? `student-reason-${student.id}` : undefined}
                      />
                      <Label
                        htmlFor={`student-${student.id}`}
                        className={`grid flex-1 gap-1 font-normal ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                      >
                        <span className="font-medium">{student.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          Mã hồ sơ #{student.profile_id} · {GRADE_LEVEL_LABELS[student.grade_level]} · {student.phone ?? "Chưa có số điện thoại"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {STUDENT_STATUS_LABELS[student.status]}
                        </span>
                        {student.active_enrollments.length === 0 ? null : (
                          <span className="text-xs text-muted-foreground">
                            Đang học: {student.active_enrollments.map((schoolClass) => schoolClass.code).join(", ")}
                          </span>
                        )}
                        {disabled && disabledReason !== null ? (
                          <span id={`student-reason-${student.id}`} className="text-xs font-medium text-destructive">
                            {enrollmentStudentDisabledReason(disabledReason)}
                          </span>
                        ) : null}
                      </Label>
                      {disabled && selected.includes(student.id) ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => toggle(student.id, false)}>
                          Bỏ chọn
                        </Button>
                      ) : (
                        <span className={`shrink-0 rounded-control border px-2 py-1 text-[10px] font-semibold ${disabled ? "border-vc-control text-muted-foreground" : "border-vc-leaf/30 bg-vc-leaf/10 text-vc-leaf"}`}>
                          {disabled ? "Không thể chọn" : "Có thể thêm"}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {meta !== undefined && meta.last_page > 1 ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Trang {meta.current_page} / {meta.last_page}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage(meta.current_page - 1)}
                >
                  Trước
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage(meta.current_page + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <span className="mr-auto text-sm text-muted-foreground">
            Đã chọn {selected.length} học sinh
          </span>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={enrol.isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={selected.length === 0 || enrol.isPending}
          >
            {enrol.isPending ? "Đang thêm…" : "Thêm vào lớp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
