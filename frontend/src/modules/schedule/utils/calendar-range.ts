import { addDays, addMonths, addWeeks, differenceInCalendarDays, format, parseISO } from "date-fns";

/**
 * The date arithmetic the calendar screen navigates and asks for windows with.
 *
 * All of it is local-time: a lesson happens on the day the school says it does, and
 * reading these dates in UTC would report yesterday for the first seven hours of every
 * Vietnamese day. `date-fns` is used rather than raw `Date` maths so month-end and
 * daylight-saving arithmetic is somebody else's solved problem.
 */

/**
 * The widest window the API will answer, in days, counting both ends.
 *
 * This is the server's rule, not a preference: a wider range is refused with
 * `SCHEDULE-013`, because the projection walks every day in the window and an
 * unbounded window is an unbounded amount of work asked for in one query string.
 * It is mirrored here only so a request that is certain to be refused is never sent;
 * the server stays the thing that enforces it.
 */
export const MAX_RANGE_DAYS = 92;

/** Which of the two calendar layouts is on screen, named as FullCalendar names them. */
export type CalendarView = "timeGridWeek" | "dayGridMonth";

/** One window of days the calendar asks the API about, both ends included. */
export type DateRange = {
  from: string;
  to: string;
};

/** Formats a `Date` the way the API writes dates. */
export function toApiDate(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

/** Counts the days in a window, counting both ends, the way the API counts them. */
export function rangeDayCount(range: DateRange): number {
  return differenceInCalendarDays(parseISO(range.to), parseISO(range.from)) + 1;
}

/** Reports whether a window is wider than the API will answer. */
export function exceedsMaxRange(range: DateRange): boolean {
  return rangeDayCount(range) > MAX_RANGE_DAYS;
}

/**
 * Converts the span a calendar view is showing into the window to ask about.
 *
 * FullCalendar reports its visible span with an **exclusive** end, so the last day
 * shown is the day before it; the API's window includes both ends. Getting this off by
 * one would silently ask about a day that is not on screen.
 *
 * The result is capped at the API's limit, so no view — however it is configured
 * later — can produce a request that is certain to be refused. Both views in this
 * screen stay well inside it: a week is 7 days and a month grid is at most 42.
 */
export function visibleRange(start: Date, endExclusive: Date): DateRange {
  const from = toApiDate(start);
  const lastDay = addDays(endExclusive, -1);
  const capped = addDays(start, MAX_RANGE_DAYS - 1);

  return {
    from,
    to: toApiDate(lastDay < capped ? lastDay : capped),
  };
}

/**
 * Moves the calendar one step back or forward, by the unit the current view reads in.
 *
 * A week view steps by weeks and a month view by months, because stepping a month view
 * by 30 days would drift off the first of the month within a year.
 */
export function shiftAnchor(anchor: string, view: CalendarView, steps: number): string {
  const date = parseISO(anchor);

  return toApiDate(view === "dayGridMonth" ? addMonths(date, steps) : addWeeks(date, steps));
}

/**
 * Names the period on screen in Vietnamese.
 *
 * The month view is titled from the anchor date rather than from the visible span,
 * because that span reaches into the neighbouring months to fill the grid and a title
 * built from it would claim the screen shows three months. The week view is titled from
 * the span itself, which is exactly the week.
 */
export function formatPeriodTitle(
  view: CalendarView,
  anchor: string,
  range: DateRange | null,
): string {
  if (view === "dayGridMonth") {
    const date = parseISO(anchor);

    return `Tháng ${format(date, "M")} năm ${format(date, "yyyy")}`;
  }

  if (range === null) {
    return "Tuần này";
  }

  return `Tuần ${format(parseISO(range.from), "dd/MM")} – ${format(parseISO(range.to), "dd/MM/yyyy")}`;
}
