import type { ScheduleSession, SessionAppearance } from "../types/schedule";
import {
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_TYPE_LABELS,
  formatSessionClass,
  formatSessionTeachers,
  formatTimeRange,
  isWrittenSession,
  sessionAppearance,
} from "./labels";

/**
 * One session as the calendar draws it: every string already composed, and the
 * appearance already decided.
 *
 * The grid receives these rather than raw payloads, so nothing inside the calendar
 * component decides what a lesson means — it only places boxes. That is also what keeps
 * the appearance rules in one testable place instead of spread across render callbacks.
 */
export type SessionEvent = {
  /**
   * The identity of the lesson, stable across refreshes.
   *
   * A written session is keyed by its row. A projected one has no row, so it is keyed
   * by the pair that *is* its identity — the fixed schedule it was cast from and the
   * date — which is also the pair a later phase will materialise it with.
   */
  key: string;
  /** Local wall-clock start, in the form FullCalendar reads without a time zone. */
  start: string;
  end: string;
  appearance: SessionAppearance;
  /** `08:00 – 09:30`. */
  timeText: string;
  /** Just the opening time, for a month cell with room for one line. */
  startTimeText: string;
  /** The class, code first. */
  classText: string;
  /** The class in as few characters as identify it, for a month cell. */
  classShortText: string;
  subjectName: string;
  roomName: string;
  /** Who leads the lesson, or everybody when there is no single leader. */
  teacherText: string;
  /** The whole lesson spelled out, for the hover text of a cell too small to hold it. */
  detailText: string;
};

/**
 * Turns the sessions of one window into the boxes the calendar draws.
 *
 * The order the API chose — by date then start time — is kept, because the calendar
 * stacks overlapping lessons in the order it receives them.
 */
export function toSessionEvents(sessions: ScheduleSession[]): SessionEvent[] {
  return sessions.map(toSessionEvent);
}

/** Builds the drawable form of one session. */
function toSessionEvent(session: ScheduleSession): SessionEvent {
  const appearance = sessionAppearance(session);

  return {
    key: eventKey(session),
    start: `${session.date}T${session.start_time}:00`,
    end: `${session.date}T${session.end_time}:00`,
    appearance,
    timeText: formatTimeRange(session.start_time, session.end_time),
    startTimeText: session.start_time,
    classText: formatSessionClass(session),
    classShortText: session.class_code ?? formatSessionClass(session),
    subjectName: session.subject_name,
    roomName: session.room_name,
    teacherText: leadTeacher(session),
    detailText: detailText(session, appearance),
  };
}

/**
 * Names the lesson uniquely without inventing an identifier for a projected session.
 *
 * The date and start time are the last resort for a written session that came from no
 * fixed schedule, which nothing in this phase can produce but the type allows.
 */
function eventKey(session: ScheduleSession): string {
  if (isWrittenSession(session)) {
    return `instance-${String(session.id)}`;
  }

  return session.template_id === null
    ? `session-${session.date}-${session.start_time}-${String(session.room_id)}`
    : `projected-${String(session.template_id)}-${session.date}`;
}

/** Names whoever leads the lesson, or says plainly that nobody does. */
function leadTeacher(session: ScheduleSession): string {
  const main = session.teachers.find((teacher) => teacher.role === 0);
  const chosen = main ?? session.teachers[0];

  if (chosen === undefined) {
    return "Chưa phân giáo viên";
  }

  const others = session.teachers.length - 1;

  return others > 0 ? `${chosen.teacher_name} +${String(others)}` : chosen.teacher_name;
}

/**
 * Spells the whole lesson out for the hover text, including the two facts a cell has no
 * room for: what kind of occasion it is, and whether anybody has recorded it yet.
 *
 * The labels are this side's own rather than the `_label` strings the API sends. The API
 * reports stable numbers and the wording shown to a reader is a presentation decision,
 * which is the same rule the rest of the module's labels follow.
 */
function detailText(session: ScheduleSession, appearance: SessionAppearance): string {
  const lines = [
    formatSessionClass(session),
    `Môn: ${session.subject_name}`,
    `Giờ: ${formatTimeRange(session.start_time, session.end_time)}`,
    `Phòng: ${session.room_name}`,
    `Giáo viên: ${formatSessionTeachers(session)}`,
    `Loại: ${SCHEDULE_TYPE_LABELS[session.schedule_type]}`,
    `Trạng thái: ${SCHEDULE_STATUS_LABELS[session.status]}`,
    appearance === "projected"
      ? "Buổi này đang theo lịch cố định, chưa ai chỉnh sửa."
      : "Buổi này đã được ghi nhận trong hệ thống.",
  ];

  if (session.note !== null && session.note !== "") {
    lines.push(`Ghi chú: ${session.note}`);
  }

  return lines.join("\n");
}
