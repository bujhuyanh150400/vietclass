"use client";

import { useCallback, useMemo, useState } from "react";

import { ScheduleCalendarView } from "../components/schedule-calendar-view";
import { useCalendarControls } from "../hooks/use-calendar-controls";
import { useClassOptions, useScheduleSessions } from "../hooks/use-schedule-sessions";
import { useRoomOptions, useTeacherOptions } from "../hooks/use-schedule-templates";
import { toSessionEvents } from "../utils/calendar-events";
import type { DateRange } from "../utils/calendar-range";
import { filterLabels } from "../utils/labels";

/**
 * Joins what the calendar is showing to what the API is asked about.
 *
 * The window is not computed here and then hoped to agree with the grid: the grid
 * reports the span it actually laid out, and that span is what goes on the wire. A month
 * layout fills its rows with days of the neighbouring months, so any window worked out
 * independently would be short by up to eleven days and leave real lessons off screen.
 *
 * Nothing is requested until the grid has reported once, because both bounds are
 * required and there is no window to guess. After that, the reported span is the only
 * source of the dates, and the URL is the only source of the filters.
 *
 * This screen reads and nothing more. It has no mutation, and so no need to ask what the
 * signed-in role may write: the API narrows a teacher's calendar to their own lessons on
 * its own, in both roles, which is a rule about who sees what rather than a control to
 * hide.
 */
export function ScheduleCalendarContainer() {
  const controls = useCalendarControls();
  const [range, setRange] = useState<DateRange | null>(null);

  /**
   * Accepts the span the grid laid out, ignoring a report that repeats the one already
   * held so a re-render cannot turn into a request.
   */
  const handleVisibleRangeChange = useCallback((next: DateRange) => {
    setRange((current) =>
      current !== null && current.from === next.from && current.to === next.to
        ? current
        : next,
    );
  }, []);

  const query = useMemo(
    () => (range === null ? null : controls.toQuery(range.from, range.to)),
    [range, controls],
  );

  const sessions = useScheduleSessions(query);
  const events = useMemo(() => toSessionEvents(sessions.sessions), [sessions.sessions]);

  const labels = useMemo(
    () =>
      filterLabels(
        sessions.sessions,
        controls.classId,
        controls.teacherId,
        controls.roomId,
      ),
    [sessions.sessions, controls.classId, controls.teacherId, controls.roomId],
  );

  return (
    <ScheduleCalendarView
      view={controls.view}
      anchorDate={controls.anchorDate}
      range={range}
      events={events}
      isPending={sessions.isPending}
      isFetching={sessions.isFetching}
      errorMessage={sessions.errorMessage}
      classId={controls.classId}
      teacherId={controls.teacherId}
      roomId={controls.roomId}
      filterLabels={labels}
      hasFilter={controls.hasFilter}
      useClassOptions={useClassOptions}
      useTeacherOptions={useTeacherOptions}
      useRoomOptions={useRoomOptions}
      onViewChange={controls.setView}
      onStep={controls.step}
      onToday={controls.goToToday}
      onClassChange={controls.setClassId}
      onTeacherChange={controls.setTeacherId}
      onRoomChange={controls.setRoomId}
      onClearFilters={controls.clearFilters}
      onVisibleRangeChange={handleVisibleRangeChange}
      onRetry={sessions.retry}
    />
  );
}
