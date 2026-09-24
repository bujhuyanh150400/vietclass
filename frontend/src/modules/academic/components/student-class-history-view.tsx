"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";

import { EmptyState } from "@/components/shared/data-table/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { PageMeta } from "@/lib/api/contracts";

import type { EnrollmentHistoryEntry, Student, StudentClass } from "../types/academic";
import { CLASS_STATUS_LABELS, GRADE_LEVEL_LABELS, formatDate } from "../utils/labels";
import {
  enrollmentEventLabel,
  enrollmentHistoryClassPath,
  enrollmentUpdateChanges,
} from "../utils/enrollment-history";
import { studentClassStatusLabel } from "../utils/student-class-history";

/** The student-class page and callbacks supplied by the detail container. */
export type StudentClassesPage = {
  classes: StudentClass[];
  meta: PageMeta | null;
  isLoading: boolean;
  isError: boolean;
  page: number;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onOpenHistory: (schoolClass: StudentClass, trigger: HTMLButtonElement) => void;
};

/** Renders one row per attended class with its membership state and class actions. */
export function StudentClassesList({
  classes,
  meta,
  isLoading,
  isError,
  page,
  onPageChange,
  onRetry,
  onOpenHistory,
}: StudentClassesPage) {
  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Đang tải danh sách lớp học" className="grid gap-3 py-2">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-24 w-full rounded-control" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        image="/images/error.webp"
        title="Không tải được danh sách lớp"
        description="Dữ liệu ghi danh vẫn an toàn. Vui lòng thử tải lại."
        action={<Button type="button" variant="outline" onClick={onRetry}>Thử lại</Button>}
        className="py-8"
      />
    );
  }

  if (classes.length === 0 && meta !== null && meta.total > 0) {
    return (
      <EmptyState
        title="Danh sách lớp đã thay đổi"
        description="Không còn bản ghi ở trang này. Hãy tải trang cuối cùng còn dữ liệu."
        action={
          <Button type="button" variant="outline" onClick={() => onPageChange(Math.max(1, meta.last_page))}>
            Tải trang cuối
          </Button>
        }
        className="py-8"
      />
    );
  }

  if (classes.length === 0) {
    return (
      <EmptyState
        image="/images/empty_1.png"
        title="Học sinh chưa từng ghi danh lớp nào"
        description="Việc ghi danh được thực hiện ở tab Học sinh trong chi tiết lớp, không thao tác từ hồ sơ học sinh."
        action={
          <Button asChild variant="link" size="sm">
            <Link href="/academic/classes">Mở danh sách lớp</Link>
          </Button>
        }
        className="py-8"
      />
    );
  }

  return (
    <>
      <ol className="divide-y divide-vc-rule" aria-label="Các lớp học của học sinh" aria-busy="false">
        {classes.map((schoolClass) => (
          <li
            key={schoolClass.id}
            className="grid min-w-0 gap-3 py-4 first:pt-1 last:pb-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center min-[861px]:grid-cols-[minmax(0,1.5fr)_minmax(128px,.62fr)_auto_auto]"
          >
            <div className="grid min-w-0 gap-1.5 sm:col-span-2 min-[861px]:col-span-1">
              <strong className="[overflow-wrap:anywhere] text-sm">{schoolClass.name}</strong>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] text-muted-foreground">
                <span>{schoolClass.code}</span>
                <span aria-hidden="true">·</span>
                <span>{GRADE_LEVEL_LABELS[schoolClass.grade_level]}</span>
                <span aria-hidden="true">·</span>
                <span>{CLASS_STATUS_LABELS[schoolClass.status]}</span>
              </p>
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                {schoolClass.subjects.map((subject) => (
                  <span
                    key={subject.id}
                    className="max-w-full truncate rounded-control border border-vc-control bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground"
                  >
                    {subject.name}
                  </span>
                ))}
              </div>
            </div>

            <span className="text-[11px] font-medium sm:row-start-2 min-[861px]:row-auto">
              {schoolClass.enrollment_periods_count} kỳ ghi danh
            </span>
            <span
              className={
                schoolClass.is_current
                  ? "w-fit rounded-control border border-vc-leaf/30 bg-vc-leaf/10 px-2 py-1 text-[10px] font-semibold text-vc-leaf sm:row-start-2 min-[861px]:row-auto"
                  : "w-fit rounded-control border border-vc-control bg-vc-tint px-2 py-1 text-[10px] font-semibold text-muted-foreground sm:row-start-2 min-[861px]:row-auto"
              }
            >
              {studentClassStatusLabel(schoolClass.is_current)}
            </span>

            <div className="flex flex-wrap items-center gap-2 sm:col-span-2 sm:col-start-1 sm:row-start-3 sm:justify-end min-[861px]:col-span-1 min-[861px]:col-start-auto min-[861px]:row-start-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-haspopup="dialog"
                aria-label={`Lịch sử ghi danh lớp ${schoolClass.code}`}
                onClick={(event) => onOpenHistory(schoolClass, event.currentTarget)}
              >
                <Clock3 aria-hidden="true" />
                Lịch sử
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/academic/classes/${schoolClass.id}?tab=students`}>
                  Xem lớp
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ol>

      {meta !== null && meta.last_page > 1 ? (
        <footer className="mt-4 flex flex-col gap-3 border-t border-vc-rule pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-muted-foreground" aria-live="polite">
            Hiển thị {(meta.current_page - 1) * meta.per_page + 1}–
            {Math.min(meta.current_page * meta.per_page, meta.total)} / {meta.total} lớp
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft aria-hidden="true" />
              Trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= meta.last_page}
              onClick={() => onPageChange(page + 1)}
            >
              Sau
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </footer>
      ) : null}
    </>
  );
}

/** Props for one class-scoped, lazily fetched enrollment history modal. */
export type StudentEnrollmentHistoryDialogProps = {
  open: boolean;
  student: Student;
  schoolClass: StudentClass | null;
  entries: EnrollmentHistoryEntry[];
  meta: PageMeta | null;
  isError: boolean;
  isFetching: boolean;
  page: number;
  onOpenChange: (open: boolean) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onRestoreFocus: () => void;
};

/** Shows only the selected student's immutable and legacy history for one class. */
export function StudentEnrollmentHistoryDialog({
  open,
  student,
  schoolClass,
  entries,
  meta,
  isError,
  isFetching,
  page,
  onOpenChange,
  onPageChange,
  onRetry,
  onRestoreFocus,
}: StudentEnrollmentHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100svh-2rem)] max-w-[calc(100%-2rem)] gap-5 overflow-y-auto p-4 sm:max-w-4xl sm:p-6"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        {schoolClass === null ? null : (
          <>
            <DialogHeader className="gap-3 pr-8">
              <div className="grid gap-1">
                <DialogTitle className="text-base sm:text-lg">
                  Lịch sử ghi danh · {schoolClass.code}
                </DialogTitle>
                <DialogDescription>
                  {schoolClass.name} · {student.full_name} · Mã học sinh {student.profile_id || student.id}
                </DialogDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-control border border-vc-control bg-vc-tint px-2 py-1 text-[10px] font-semibold">
                  {studentClassStatusLabel(schoolClass.is_current)}
                </span>
                {schoolClass.subjects.map((subject) => (
                  <span
                    key={subject.id}
                    className="rounded-control border border-vc-control bg-card px-2 py-1 text-[10px] text-muted-foreground"
                  >
                    {subject.name}
                  </span>
                ))}
                <span className="text-[10px] text-muted-foreground">
                  {schoolClass.enrollment_periods_count} kỳ ghi danh
                </span>
              </div>
            </DialogHeader>

            <p className="text-[11px] leading-[1.6] text-muted-foreground">
              Chỉ gồm các kỳ ghi danh của học sinh này trong lớp {schoolClass.code}. Lịch sử là nhật ký
              bất biến, không sửa hay xóa được.
            </p>

            <div aria-live="polite" aria-busy={isFetching}>
              {isFetching ? (
                <HistorySkeleton />
              ) : isError ? (
                <EmptyState
                  image="/images/error.webp"
                  title={`Không tải được lịch sử lớp ${schoolClass.code}`}
                  description="Dữ liệu ghi danh vẫn an toàn và chưa có thay đổi nào. Hãy thử tải lại."
                  action={<Button type="button" variant="outline" onClick={onRetry}>Thử lại</Button>}
                  className="py-8"
                />
              ) : entries.length === 0 ? (
                <EmptyState
                  image="/images/empty_1.png"
                  title="Chưa có mục lịch sử cho lớp này"
                  description="Các sự kiện ghi danh và kỳ ghi danh cũ của lớp sẽ xuất hiện tại đây."
                  className="py-8"
                />
              ) : (
                <>
                  <ol className="grid gap-3" aria-label={`Lịch sử ghi danh lớp ${schoolClass.code}`}>
                    {entries.map((entry) => (
                      <EnrollmentHistoryCard key={`${entry.kind}-${entry.id}`} entry={entry} />
                    ))}
                  </ol>
                  {meta !== null && meta.last_page > 1 ? (
                    <footer className="mt-4 flex flex-col gap-3 border-t border-vc-rule pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[11px] text-muted-foreground" aria-live="polite">
                        {(meta.current_page - 1) * meta.per_page + 1}–
                        {Math.min(meta.current_page * meta.per_page, meta.total)} / {meta.total} mục · mới nhất trước
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => onPageChange(page - 1)}
                        >
                          <ChevronLeft aria-hidden="true" />
                          Trước
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={page >= meta.last_page}
                          onClick={() => onPageChange(page + 1)}
                        >
                          Sau
                          <ChevronRight aria-hidden="true" />
                        </Button>
                      </div>
                    </footer>
                  ) : null}
                </>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Đóng</Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Renders the timeline loading state without fabricating event data. */
function HistorySkeleton() {
  return (
    <div className="grid gap-3" role="status">
      <span className="sr-only">Đang tải lịch sử ghi danh</span>
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-28 w-full rounded-control" />
      ))}
    </div>
  );
}

/** Formats an event creation timestamp as the recorded local date and time. */
function formatRecordedAt(value: string): string {
  const timestamp = new Date(value);

  return Number.isNaN(timestamp.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(timestamp);
}

/** Renders one event or an explicitly un-interpreted legacy period. */
function EnrollmentHistoryCard({ entry }: { entry: EnrollmentHistoryEntry }) {
  const classPath = enrollmentHistoryClassPath(entry);
  const isLegacy = entry.kind === "legacy_enrollment";
  const updateChanges = enrollmentUpdateChanges(entry);
  const terminalEvent = entry.kind === "event" && [2, 3, 5].includes(entry.event_type);
  const note = isLegacy ? entry.enrollment.note : entry.note;

  return (
    <li className="grid min-w-0 gap-2 border-l border-vc-rule pb-3 pl-4 sm:grid-cols-[105px_minmax(0,1fr)] sm:gap-4 sm:border-0 sm:pb-0 sm:pl-0">
      <time
        dateTime={entry.effective_on}
        className="relative text-[10px] font-medium text-muted-foreground sm:pt-3 sm:text-right sm:font-mono"
      >
        <span aria-hidden="true" className="absolute -left-[21px] top-0.5 size-3 rounded-full border-2 border-background bg-vc-ink sm:left-auto sm:-right-[21px] sm:top-4" />
        {formatDate(entry.effective_on)}
      </time>

      <article className="min-w-0 rounded-control border border-vc-rule bg-card p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={
              terminalEvent
                ? "rounded-control border border-vc-orange/40 bg-vc-orange/10 px-2 py-1 text-[10px] font-semibold text-vc-orange-deep"
                : "rounded-control border border-vc-control bg-background px-2 py-1 text-[10px] font-semibold"
            }
          >
            {isLegacy ? "Kỳ ghi danh cũ — không có log chi tiết" : enrollmentEventLabel(entry.event_type)}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Ngày hiệu lực</span>
        </div>

        <h3 className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-[1.5] font-semibold">
          {classPath.length === 2 ? (
            <>
              <span>Từ</span>
              <HistoryClassLink schoolClass={classPath[0]} />
              <span>sang</span>
              <HistoryClassLink schoolClass={classPath[1]} />
            </>
          ) : (
            <HistoryClassLink schoolClass={classPath[0]} />
          )}
        </h3>

        {isLegacy ? (
          <>
            <p className="mt-2 text-[11px] leading-[1.6] text-muted-foreground">
              Vào lớp {formatDate(entry.enrollment.enrolled_at)} · Rời lớp {formatDate(entry.enrollment.left_at)}
            </p>
            <p className="mt-2 break-words whitespace-pre-wrap text-[11px] leading-[1.6]">
              <strong className="mr-1 text-muted-foreground">Ghi chú gốc</strong>
              {note || "—"}
            </p>
            <p className="mt-2 text-[10px] leading-[1.6] text-muted-foreground">
              Ghi chú được giữ nguyên văn. Hệ thống không suy ra thao tác, người thực hiện hay lớp đối ứng từ ghi chú này.
            </p>
            <p className="mt-2 text-[10px] text-muted-foreground">Người thực hiện · Không có thông tin</p>
          </>
        ) : (
          <>
            {entry.event_type === 1 ? (
              <ul className="mt-2 grid gap-1.5 rounded-control border border-vc-rule bg-background p-3 text-[11px]">
                {updateChanges.map((change) => (
                  <li key={change.field} className="flex flex-wrap items-center gap-2">
                    <span className="min-w-24 font-semibold text-muted-foreground">
                      {change.field === "enrolled_at"
                        ? "Ngày vào lớp"
                        : change.field === "left_at"
                          ? "Ngày rời lớp"
                          : "Ghi chú"}
                    </span>
                    <span>{formatHistoryValue(change.field, change.before)}</span>
                    <ArrowRight aria-hidden="true" className="size-3 text-muted-foreground" />
                    <span>{formatHistoryValue(change.field, change.after)}</span>
                  </li>
                ))}
              </ul>
            ) : note ? (
              <p className="mt-2 break-words whitespace-pre-wrap text-[11px] leading-[1.6]">
                {entry.event_type === 2 ? <strong className="mr-1 text-muted-foreground">Lý do</strong> : null}
                {note}
              </p>
            ) : entry.event_type === 0 ? (
              <p className="mt-2 text-[10px] text-muted-foreground">Không có ghi chú khi ghi danh.</p>
            ) : null}
            <p className="mt-2 text-[10px] leading-[1.5] text-muted-foreground">
              Người thực hiện · {entry.actor?.username ?? "Không có thông tin"}
              <span aria-hidden="true"> · </span>
              Ghi lúc {formatRecordedAt(entry.created_at)}
            </p>
          </>
        )}
      </article>
    </li>
  );
}

/** Formats an enrollment snapshot value without exposing serialized metadata. */
function formatHistoryValue(field: "enrolled_at" | "left_at" | "note", value: string | null): string {
  if (value === null || value === "") return "trống";

  return field === "note" ? `“${value}”` : formatDate(value);
}

/** Links one event's class to its normal class-detail contract. */
function HistoryClassLink({
  schoolClass,
}: {
  schoolClass: EnrollmentHistoryEntry["enrollment"]["class"];
}) {
  return (
    <Link
      href={`/academic/classes/${schoolClass.id}`}
      className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1 underline decoration-1 underline-offset-2 hover:decoration-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="font-mono text-[10px]">{schoolClass.code}</span>
      <span className="[overflow-wrap:anywhere]">{schoolClass.name}</span>
    </Link>
  );
}
