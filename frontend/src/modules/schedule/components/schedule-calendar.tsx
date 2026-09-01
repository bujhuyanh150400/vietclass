"use client";

import { useEffect, useMemo, useRef } from "react";
import type {
  DatesSetArg,
  DayHeaderContentArg,
  EventContentArg,
  EventInput,
} from "@fullcalendar/core";
import viLocale from "@fullcalendar/core/locales/vi";
import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";

import { cn } from "@/lib/utils/index";

import type { SessionEvent } from "../utils/calendar-events";
import { visibleRange, type CalendarView, type DateRange } from "../utils/calendar-range";
import { DAY_OF_WEEK_LABELS } from "../utils/labels";
import "../styles/calendar.css";

import type { SessionAppearance } from "../types/schedule";

/** What the grid needs to draw itself, and the one thing it reports back. */
export type ScheduleCalendarProps = {
  view: CalendarView;
  /** The day the shown period is worked out from. */
  anchorDate: string;
  events: SessionEvent[];
  /**
   * Reports the span the grid actually laid out, so the window asked of the API is
   * the window on screen rather than one computed twice and hoped to agree.
   */
  onVisibleRangeChange: (range: DateRange) => void;
};

/** The earliest and latest hour a grid row is drawn for when no lesson says otherwise. */
const DEFAULT_DAY_START = 7;
const DEFAULT_DAY_END = 21;

/**
 * Draws one period of lessons as a week-by-hour grid or a month grid.
 *
 * Purely presentational: it receives events whose every string and appearance is
 * already resolved, reports the span it laid out, and reads nothing itself. There is no
 * interaction beyond looking — no dragging, no selecting, no clicking through — because
 * the only write the API offers in this phase materialises a lesson, which is plumbing
 * nobody asks for by name. That is why the boxes are inert and the toolbar lives above
 * this component rather than inside it.
 *
 * The layout and the period are props, and FullCalendar is told about a change to
 * either through its own API. It keeps its own copy of both after mounting, so the
 * alternative — remounting the grid on every step through the weeks — would throw away
 * its layout for no reason.
 *
 * FullCalendar's own header is switched off. Its buttons would carry the library's
 * wording and styling, and the period title it builds for a month grid names the span
 * it draws, which reaches into the neighbouring months.
 */
export function ScheduleCalendar({
  view,
  anchorDate,
  events,
  onVisibleRangeChange,
}: ScheduleCalendarProps) {
  const calendarRef = useRef<FullCalendar | null>(null);

  useEffect(() => {
    // `changeView` moves both the layout and the date in one call, and does nothing
    // when neither has actually changed.
    calendarRef.current?.getApi().changeView(view, anchorDate);
  }, [view, anchorDate]);

  const inputs = useMemo<EventInput[]>(
    () =>
      events.map((event) => ({
        id: event.key,
        start: event.start,
        end: event.end,
        extendedProps: { session: event },
      })),
    [events],
  );

  const hours = useMemo(() => dayBounds(events), [events]);

  return (
    <div className="vc-calendar rounded-lg border bg-card p-2 text-[13px] sm:p-3">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, dayGridPlugin]}
        initialView={view}
        initialDate={anchorDate}
        // The locale carries Vietnamese wording and, with it, a week that starts on
        // Monday; `firstDay` states that outright so it survives a locale change.
        locale={viLocale}
        firstDay={1}
        headerToolbar={false}
        height="auto"
        expandRows
        // Every lesson has a start and an end, so the all-day strip would be an empty
        // row on every screen.
        allDaySlot={false}
        nowIndicator
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        slotMinTime={`${pad(hours.start)}:00:00`}
        slotMaxTime={`${pad(hours.end)}:00:00`}
        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        displayEventTime={false}
        eventDisplay="block"
        dayMaxEvents={3}
        events={inputs}
        eventClassNames={eventClassNames}
        eventContent={renderEvent}
        dayHeaderContent={renderDayHeader}
        datesSet={(arg: DatesSetArg) => {
          onVisibleRangeChange(visibleRange(arg.start, arg.end));
        }}
      />
    </div>
  );
}

/**
 * Widens the hours drawn so no lesson falls outside the grid.
 *
 * A calendar of ordinary school hours should not open on a wall of empty night rows,
 * but a lesson at six in the morning must still be visible, so the default window is
 * stretched by the data rather than trusted over it.
 */
function dayBounds(events: SessionEvent[]): { start: number; end: number } {
  let start = DEFAULT_DAY_START;
  let end = DEFAULT_DAY_END;

  for (const event of events) {
    const from = hourOf(event.start);
    const to = hourOf(event.end);

    start = Math.min(start, from);
    // A lesson ending at 21:15 needs the row for 22:00 to be drawn.
    end = Math.max(end, minuteOf(event.end) === 0 ? to : to + 1);
  }

  return { start: Math.max(0, start), end: Math.min(24, end) };
}

/** Reads the hour out of a local `YYYY-MM-DDTHH:MM:SS` string. */
function hourOf(value: string): number {
  return Number.parseInt(value.slice(11, 13), 10);
}

/** Reads the minute out of a local `YYYY-MM-DDTHH:MM:SS` string. */
function minuteOf(value: string): number {
  return Number.parseInt(value.slice(14, 16), 10);
}

/** Formats an hour as the two digits FullCalendar's time options expect. */
function pad(hour: number): string {
  return String(hour).padStart(2, "0");
}

/** Reads back the event this module put on the FullCalendar event. */
function sessionOf(arg: EventContentArg): SessionEvent {
  return arg.event.extendedProps.session as SessionEvent;
}

/**
 * Marks each box with the kind of lesson it is, so the appearance is readable in the
 * DOM as well as on screen.
 */
function eventClassNames(arg: EventContentArg): string[] {
  return ["vc-session", `vc-session--${sessionOf(arg).appearance}`];
}

/**
 * The three appearances, as borders and fills.
 *
 * Colour is never the only difference: a lesson still following the fixed schedule is
 * outlined in a **broken** line, one that has been recorded is outlined in a solid line
 * and carries a filled dot, and a cancelled one has its class struck through and says
 * so in words. A reader who cannot separate the hues still reads all three.
 */
const APPEARANCE_CLASSES: Record<SessionAppearance, string> = {
  projected: "border border-dashed border-vc-gold/70 bg-vc-gold/10 text-vc-ink",
  written: "border border-solid border-vc-leaf bg-vc-leaf/12 text-vc-ink",
  cancelled: "border border-solid border-vc-ember bg-vc-ember/8 text-muted-foreground",
};

/**
 * Draws one lesson: three lines where a week grid gives the room, and one where a month
 * grid does not.
 *
 * The whole visible box is this module's own markup rather than FullCalendar's, which
 * is what lets a broken outline and a struck-through class mean what they mean here.
 * The full details go on the element's title, so a box too small to hold them is still
 * readable on hover without a screen that can be clicked into.
 */
function renderEvent(arg: EventContentArg) {
  const session = sessionOf(arg);
  const box = APPEARANCE_CLASSES[session.appearance];
  const isMonth = arg.view.type === "dayGridMonth";

  if (isMonth) {
    return (
      <div
        title={session.detailText}
        className={cn("flex items-center gap-1 overflow-hidden rounded px-1 py-px", box)}
      >
        <span className="shrink-0 tabular-nums opacity-70">{session.startTimeText}</span>
        {session.appearance === "written" ? <Dot /> : null}
        <span
          className={cn(
            "truncate",
            session.appearance === "cancelled" && "line-through",
          )}
        >
          {session.classShortText}
        </span>
      </div>
    );
  }

  // Three lines, not four: a ninety-minute lesson is about sixty pixels tall on this
  // grid, and a fourth line is clipped through the middle of its glyphs.
  return (
    <div
      title={session.detailText}
      className={cn("h-full overflow-hidden rounded px-1 py-0.5 leading-tight", box)}
    >
      <p className="flex items-center gap-1 font-medium">
        {session.appearance === "written" ? <Dot /> : null}
        {session.appearance === "cancelled" ? (
          <span className="shrink-0 font-semibold uppercase">Đã huỷ</span>
        ) : null}
        <span className={cn("truncate", session.appearance === "cancelled" && "line-through")}>
          {session.classShortText}
        </span>
      </p>
      <p className="truncate text-[11px] opacity-80">{session.timeText}</p>
      <p className="truncate text-[11px] opacity-80">
        {session.subjectName} · {session.roomName} · {session.teacherText}
      </p>
    </div>
  );
}

/** The filled mark that says a lesson has been recorded rather than merely scheduled. */
function Dot() {
  return <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-vc-leaf" />;
}

/**
 * Names a column in Vietnamese, as the rest of the product writes weekdays.
 *
 * The browser's own Vietnamese formatting abbreviates differently — `T2`, `CN` — so the
 * module's own weekday names are used instead, and they are indexed by the API's
 * numbering where Monday is `0`, not by the `Date` numbering where Sunday is.
 */
function renderDayHeader(arg: DayHeaderContentArg) {
  const label = DAY_OF_WEEK_LABELS[weekdayIndex(arg.date)];

  if (arg.view.type === "dayGridMonth") {
    return <span className="font-medium">{label}</span>;
  }

  return (
    <span className="flex flex-col items-center gap-0.5 py-1">
      <span className="text-xs font-medium">{label}</span>
      <span className="text-sm tabular-nums">
        {String(arg.date.getDate()).padStart(2, "0")}/
        {String(arg.date.getMonth() + 1).padStart(2, "0")}
      </span>
    </span>
  );
}

/** Converts a `Date`'s Sunday-first weekday into the API's Monday-first numbering. */
function weekdayIndex(date: Date): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  return ((date.getDay() + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}
