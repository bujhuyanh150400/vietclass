"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon, TriangleAlertIcon } from "lucide-react";

import { AsyncSelectField } from "@/components/shared/async-select-field";
import { PageHeader } from "@/components/shared/data-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/index";

import { ScheduleCalendar } from "./schedule-calendar";
import type { Option, SessionAppearance } from "../types/schedule";
import type { SessionEvent } from "../utils/calendar-events";
import { formatPeriodTitle, type CalendarView, type DateRange } from "../utils/calendar-range";
import { SESSION_APPEARANCE_LABELS, type FilterLabels } from "../utils/labels";

/** The signature the module's option hooks share: a search term in, matches out. */
type UseOptionsHook = (search: string) => UseQueryResult<Option[]>;

/** Everything the calendar screen renders, and everything it reports back. */
export type ScheduleCalendarViewProps = {
  view: CalendarView;
  anchorDate: string;
  /** The span the grid last laid out, or `null` before it has laid out at all. */
  range: DateRange | null;
  events: SessionEvent[];
  isPending: boolean;
  isFetching: boolean;
  /** A refusal to show instead of the grid's contents, from either side. */
  errorMessage: string | null;
  classId: number | null;
  teacherId: number | null;
  roomId: number | null;
  /**
   * What each active filter is called, read from the lessons on screen, so a filter
   * restored from a link never reads as a bare identifier.
   */
  filterLabels: FilterLabels;
  hasFilter: boolean;
  useClassOptions: UseOptionsHook;
  useTeacherOptions: UseOptionsHook;
  useRoomOptions: UseOptionsHook;
  onViewChange: (view: CalendarView) => void;
  onStep: (steps: number) => void;
  onToday: () => void;
  onClassChange: (value: number) => void;
  onTeacherChange: (value: number) => void;
  onRoomChange: (value: number) => void;
  onClearFilters: () => void;
  onVisibleRangeChange: (range: DateRange) => void;
  onRetry: () => void;
};

/** The two layouts, and what each is called to a reader. */
const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: "timeGridWeek", label: "Tuần" },
  { value: "dayGridMonth", label: "Tháng" },
];

/** How each appearance is drawn in the legend, matching the boxes on the grid. */
const LEGEND_SWATCHES: Record<SessionAppearance, string> = {
  projected: "border-dashed border-vc-gold/70 bg-vc-gold/10",
  written: "border-solid border-vc-leaf bg-vc-leaf/12",
  cancelled: "border-solid border-vc-ember bg-vc-ember/8",
};

/** What each appearance means, in the words a scheduler would use. */
const LEGEND_HINTS: Record<SessionAppearance, string> = {
  projected: "Chưa ai chỉnh sửa, đang theo lịch cố định của lớp.",
  written: "Đã có người sửa hoặc ghi nhận buổi này.",
  cancelled: "Buổi này sẽ không diễn ra.",
};

/**
 * Renders the whole lesson calendar: which period is shown, whose lessons are shown,
 * the grid itself, and what each kind of box means.
 *
 * Purely presentational. It reads nothing and writes nothing — every value arrives as a
 * prop and every gesture leaves as a callback, including the option hooks the three
 * pickers search with, which is the same arrangement the fixed-schedule form uses.
 *
 * **There is no control here that changes anything.** The only write the API offers in
 * this phase materialises a projected lesson into a row, and nobody sets out to
 * materialise a lesson: they cancel one, move one, or record that it was taught, and all
 * three arrive later. Every button below navigates or narrows.
 */
export function ScheduleCalendarView({
  view,
  anchorDate,
  range,
  events,
  isPending,
  isFetching,
  errorMessage,
  classId,
  teacherId,
  roomId,
  filterLabels,
  hasFilter,
  useClassOptions,
  useTeacherOptions,
  useRoomOptions,
  onViewChange,
  onStep,
  onToday,
  onClassChange,
  onTeacherChange,
  onRoomChange,
  onClearFilters,
  onVisibleRangeChange,
  onRetry,
}: ScheduleCalendarViewProps) {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Lịch học"
        description="Buổi học của mọi lớp theo tuần và theo tháng, gồm cả những buổi chiếu ra từ lịch cố định."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Kỳ trước"
            onClick={() => onStep(-1)}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Kỳ sau"
            onClick={() => onStep(1)}
          >
            <ChevronRightIcon />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onToday}>
            Hôm nay
          </Button>
          <p
            aria-live="polite"
            className="text-base font-semibold tracking-tight sm:text-lg"
          >
            {formatPeriodTitle(view, anchorDate, range)}
          </p>
          {isFetching ? (
            <span className="text-xs text-muted-foreground">Đang tải…</span>
          ) : null}
        </div>

        <div
          role="group"
          aria-label="Dạng xem"
          className="inline-flex rounded-md border p-0.5"
        >
          {VIEW_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={view === option.value ? "secondary" : "ghost"}
              aria-pressed={view === option.value}
              onClick={() => onViewChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <AsyncSelectField
          name="calendar-class"
          label="Lớp học"
          useOptions={useClassOptions}
          value={classId ?? undefined}
          selectedLabel={filterLabels.classLabel}
          onChange={onClassChange}
          placeholder="Mọi lớp"
          searchPlaceholder="Nhập tên hoặc mã lớp…"
          hint="Chỉ liệt kê lớp đang chạy."
        />
        <AsyncSelectField
          name="calendar-teacher"
          label="Giáo viên"
          useOptions={useTeacherOptions}
          value={teacherId ?? undefined}
          selectedLabel={filterLabels.teacherLabel}
          onChange={onTeacherChange}
          placeholder="Mọi giáo viên"
          searchPlaceholder="Nhập tên giáo viên…"
          hint="Tính cả buổi người đó làm trợ giảng."
        />
        <AsyncSelectField
          name="calendar-room"
          label="Phòng học"
          useOptions={useRoomOptions}
          value={roomId ?? undefined}
          selectedLabel={filterLabels.roomLabel}
          onChange={onRoomChange}
          placeholder="Mọi phòng"
          searchPlaceholder="Nhập tên phòng…"
          hint="Chỉ liệt kê phòng đang hoạt động."
        />
      </div>

      {hasFilter ? (
        <div>
          <Button type="button" variant="ghost" size="sm" onClick={onClearFilters}>
            Bỏ bộ lọc
          </Button>
        </div>
      ) : null}

      {errorMessage === null ? null : (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Không tải được lịch học</AlertTitle>
          <AlertDescription>
            <p>{errorMessage}</p>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <ScheduleCalendar
        view={view}
        anchorDate={anchorDate}
        events={events}
        onVisibleRangeChange={onVisibleRangeChange}
      />

      {isPending || events.length > 0 || errorMessage !== null ? null : (
        <p className="text-sm text-muted-foreground">
          Không có buổi học nào trong khoảng này. Lớp chưa khai lịch cố định thì lịch
          học sẽ trống.
        </p>
      )}

      <dl className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
        {(Object.keys(LEGEND_SWATCHES) as SessionAppearance[]).map((appearance) => (
          <div key={appearance} className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn("h-3 w-5 rounded border", LEGEND_SWATCHES[appearance])}
            />
            <dt className="font-medium text-foreground">
              {SESSION_APPEARANCE_LABELS[appearance]}
            </dt>
            <dd>{LEGEND_HINTS[appearance]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
