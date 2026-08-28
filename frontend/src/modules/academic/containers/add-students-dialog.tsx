"use client";

import { useState } from "react";

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
import { isApiClientError } from "@/lib/api/api-client-error";

import { DateField } from "../components/date-field";
import { Field } from "../components/field";
import { useAvailableStudents, useEnrolStudents } from "../hooks/use-enrollments";
import { GRADE_LEVEL_LABELS } from "../utils/labels";

/** Today, as the API writes dates, used as the default join date. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Picks students to add to one class, all joining from the same date.
 *
 * The list offers only students who may actually be added — an account that still
 * works, and no running membership of this class — so a choice the API would refuse
 * is never presented. Someone who left the class before does appear, because
 * enrolling again is allowed and keeps the earlier period as history.
 *
 * Capacity is checked by the API for the whole batch at once, so a selection that
 * would overfill the class is refused as a whole and reported here.
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

  const available = useAvailableStudents(classId, search, page);
  const enrol = useEnrolStudents(classId);

  /** Adds or removes one student from the selection. */
  function toggle(studentId: number) {
    setSelected((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
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
      await enrol.mutateAsync({ student_ids: selected, enrolled_at: enrolledAt });
      reset();
      onOpenChange(false);
    } catch (caught) {
      setError(
        isApiClientError(caught) ? caught.message : "Không thêm được học sinh vào lớp.",
      );
    }
  }

  const rows = available.data?.data ?? [];
  const meta = available.data?.meta;

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
      <DialogContent className="sm:max-w-2xl">
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
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-lg border">
            {available.isPending ? (
              <div aria-hidden="true" className="grid gap-3 p-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            ) : rows.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Không còn học sinh nào có thể thêm vào lớp này.
              </p>
            ) : (
              <ul className="divide-y">
                {rows.map((student) => (
                  <li key={student.id} className="flex items-center gap-3 px-4 py-3">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={selected.includes(student.id)}
                      onCheckedChange={() => toggle(student.id)}
                    />
                    <Label
                      htmlFor={`student-${student.id}`}
                      className="grid flex-1 cursor-pointer gap-0.5 font-normal"
                    >
                      <span className="font-medium">{student.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {GRADE_LEVEL_LABELS[student.grade_level]} ·{" "}
                        {student.phone ?? "Chưa có số điện thoại"}
                      </span>
                    </Label>
                  </li>
                ))}
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
