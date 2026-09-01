"use client";

import { useCallback } from "react";
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import { shiftAnchor, type CalendarView } from "../utils/calendar-range";
import { today } from "../utils/labels";
import type { ScheduleSessionQuery } from "../types/schedule";

/** The two layouts this screen offers, named as FullCalendar names them. */
const VIEWS = ["timeGridWeek", "dayGridMonth"] as const;

/** What the calendar screen reads and changes about which days and whose lessons it shows. */
export type CalendarControls = {
  view: CalendarView;
  /** The day the shown period is worked out from, always a real date. */
  anchorDate: string;
  classId: number | null;
  teacherId: number | null;
  roomId: number | null;
  /** Whether any of the three filters is narrowing the calendar. */
  hasFilter: boolean;
  setView: (view: CalendarView) => void;
  /** Steps back or forward by one week or one month, whichever the view reads in. */
  step: (steps: number) => void;
  goToToday: () => void;
  setClassId: (value: number) => void;
  setTeacherId: (value: number) => void;
  setRoomId: (value: number) => void;
  clearFilters: () => void;
  /** Builds the filter half of a calendar read; the window comes from the grid. */
  toQuery: (from: string, to: string) => ScheduleSessionQuery;
};

/**
 * Keeps which period and whose lessons the calendar shows in the URL rather than in
 * component state, so a particular week of a particular teacher can be linked to,
 * reloaded, and navigated back to unchanged — the same reason every list screen in
 * this codebase keeps its search and page there.
 *
 * The anchor date is stored as an empty default meaning "today", rather than as
 * today's actual date, because a literal date would be baked into the URL on first
 * render and the link would still open that day a week later. Today is resolved at
 * read time instead.
 */
export function useCalendarControls(): CalendarControls {
  const [state, setState] = useQueryStates(
    {
      view: parseAsStringLiteral(VIEWS).withDefault("timeGridWeek"),
      date: parseAsString.withDefault(""),
      class: parseAsInteger,
      teacher: parseAsInteger,
      room: parseAsInteger,
    },
    { history: "replace", clearOnDefault: true },
  );

  const anchorDate = state.date === "" ? today() : state.date;

  /**
   * Switches layout, keeping the anchor so the week on screen stays inside the month
   * that replaces it.
   */
  const setView = useCallback(
    (view: CalendarView) => {
      void setState({ view });
    },
    [setState],
  );

  const step = useCallback(
    (steps: number) => {
      void setState({ date: shiftAnchor(anchorDate, state.view, steps) });
    },
    [setState, anchorDate, state.view],
  );

  /** Returns to the current period by dropping the stored date rather than writing today's. */
  const goToToday = useCallback(() => {
    void setState({ date: null });
  }, [setState]);

  const setClassId = useCallback(
    (value: number) => {
      void setState({ class: value });
    },
    [setState],
  );

  const setTeacherId = useCallback(
    (value: number) => {
      void setState({ teacher: value });
    },
    [setState],
  );

  const setRoomId = useCallback(
    (value: number) => {
      void setState({ room: value });
    },
    [setState],
  );

  const clearFilters = useCallback(() => {
    void setState({ class: null, teacher: null, room: null });
  }, [setState]);

  /**
   * Omits a filter that is not set rather than sending it empty, because the API reads
   * the presence of `class_id` as the filter being applied.
   */
  const toQuery = useCallback(
    (from: string, to: string): ScheduleSessionQuery => ({
      from,
      to,
      classId: state.class ?? undefined,
      teacherId: state.teacher ?? undefined,
      roomId: state.room ?? undefined,
    }),
    [state.class, state.teacher, state.room],
  );

  return {
    view: state.view,
    anchorDate,
    classId: state.class,
    teacherId: state.teacher,
    roomId: state.room,
    hasFilter: state.class !== null || state.teacher !== null || state.room !== null,
    setView,
    step,
    goToToday,
    setClassId,
    setTeacherId,
    setRoomId,
    clearFilters,
    toQuery,
  };
}
