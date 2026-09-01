import { format } from "date-fns";

import type {
  DayOfWeek,
  ScheduleEffectiveState,
  ScheduleSession,
  ScheduleStatus,
  ScheduleTeacherRole,
  ScheduleTemplate,
  ScheduleType,
  SessionAppearance,
} from "../types/schedule";

/**
 * Vietnamese labels for the schedule API's integer enums, and the small date and
 * time formatters the schedule screens read them with.
 *
 * They live here rather than on the API's PHP enums for the same reason the
 * academic labels do: the API reports stable numbers, and the words shown to a
 * reader are a presentation decision. Each map is exhaustive over its union, so
 * adding a value to the API without naming it here is a type error rather than a
 * blank cell on screen.
 */

/** The weekday a slot repeats on. `0` is Monday, matching the API rather than ISO. */
export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  0: "Thứ 2",
  1: "Thứ 3",
  2: "Thứ 4",
  3: "Thứ 5",
  4: "Thứ 6",
  5: "Thứ 7",
  6: "Chủ nhật",
};

/** Every weekday in the order a Vietnamese week is read, for a picker. */
export const DAYS_OF_WEEK: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

/** The part a teacher plays on a slot. */
export const SCHEDULE_TEACHER_ROLE_LABELS: Record<ScheduleTeacherRole, string> = {
  0: "Giáo viên chính",
  1: "Trợ giảng",
};

/** What kind of occasion a session is. */
export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  0: "Lịch chính",
  1: "Học bù",
  2: "Tăng cường",
};

/** Where a session stands in its own life. */
export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  0: "Chưa diễn ra",
  1: "Đã diễn ra",
  2: "Đã huỷ",
};

/** How each kind of session is described on the calendar's legend. */
export const SESSION_APPEARANCE_LABELS: Record<SessionAppearance, string> = {
  projected: "Theo lịch cố định",
  written: "Đã ghi nhận",
  cancelled: "Đã huỷ",
};

/** Where a slot stands relative to today. */
export const SCHEDULE_STATE_LABELS: Record<ScheduleEffectiveState, string> = {
  upcoming: "Chưa áp dụng",
  active: "Đang áp dụng",
  ended: "Đã kết thúc",
};

/**
 * Returns today as the API writes dates.
 *
 * The date is read in the reader's own time zone rather than in UTC, because this
 * value decides which schedules are shown as running today and a UTC reading
 * would report yesterday for the first seven hours of every Vietnamese day.
 */
export function today(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Formats an API date (`YYYY-MM-DD`) the way dates are written in Vietnamese,
 * returning a dash when the API reported none.
 */
export function formatDate(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const [year, month, day] = value.split("-");

  return year && month && day ? `${day}/${month}/${year}` : value;
}

/**
 * Formats the weekly time range of a slot as one readable span.
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} – ${endTime}`;
}

/**
 * Describes the date range a slot applies over, saying so in words when it has no
 * end date rather than leaving a dash a reader has to interpret.
 */
export function formatEffectiveRange(template: ScheduleTemplate): string {
  const from = formatDate(template.start_date);

  return template.end_date === null
    ? `Từ ${from}, chưa có ngày kết thúc`
    : `${from} – ${formatDate(template.end_date)}`;
}

/**
 * Works out whether a slot is already finished, running now, or still to come.
 *
 * This is derived here rather than read from the API's `is_closed`, which only
 * reports whether an `end_date` was set at all: a slot closed with a date still in
 * the future is `is_closed: true` while it is very much still being taught, and
 * labelling that "đã đóng" would tell a reader their class had stopped.
 */
export function scheduleEffectiveState(
  template: ScheduleTemplate,
  onDate: string = today(),
): ScheduleEffectiveState {
  if (template.end_date !== null && template.end_date < onDate) {
    return "ended";
  }

  if (template.start_date !== null && template.start_date > onDate) {
    return "upcoming";
  }

  return "active";
}

/**
 * Names the assistants of a slot for display, or says there are none.
 */
export function formatAssistantTeachers(template: ScheduleTemplate): string {
  const names = (template.assistant_teachers ?? [])
    .map((teacher) => teacher.teacher_name ?? `#${teacher.teacher_profile_id}`);

  return names.length === 0 ? "Không có" : names.join(", ");
}

/**
 * Reports whether a row has been written for this session.
 *
 * This is the only sanctioned way to ask: `id` being `null` is what the API reports for
 * a lesson nobody has touched, and reading that null directly invites treating it as
 * missing data rather than as the answer it is.
 */
export function isWrittenSession(session: ScheduleSession): boolean {
  return session.id !== null;
}

/**
 * Decides how one session should read on the calendar.
 *
 * Cancellation is checked first because it outranks everything else a reader needs to
 * know: a cancelled lesson is still returned, still occupies its slot, and still blocks
 * its own projection, so it must never be mistaken for one that will be taught.
 *
 * Otherwise the question is whether anybody has touched the lesson. `is_customized` is
 * what the API sets the moment a row is written, and a status past "not held yet" says
 * the same thing from the other direction, so either mark makes a session "written".
 * A session with neither is exactly what the fixed schedule projects, and nothing more.
 */
export function sessionAppearance(session: ScheduleSession): SessionAppearance {
  if (session.status === 2) {
    return "cancelled";
  }

  return session.is_customized || session.status !== 0 ? "written" : "projected";
}

/**
 * Names the class of a session the way a reader identifies it: the code first, because
 * class names repeat across grades and codes do not.
 *
 * A session belonging to no class says so in words rather than showing a blank, which
 * is what a pooled make-up lesson of a later phase will look like.
 */
export function formatSessionClass(session: ScheduleSession): string {
  if (session.class_code === null && session.class_name === null) {
    return "Không thuộc lớp nào";
  }

  if (session.class_code === null) {
    return session.class_name ?? "Không thuộc lớp nào";
  }

  return session.class_name === null
    ? session.class_code
    : `${session.class_code} — ${session.class_name}`;
}

/**
 * Composes the one line a calendar cell has room for: which class, and which subject.
 */
export function formatSessionTitle(session: ScheduleSession): string {
  return `${formatSessionClass(session)} · ${session.subject_name}`;
}

/** What each active calendar filter is called, when the shown lessons reveal it. */
export type FilterLabels = {
  classLabel?: string;
  teacherLabel?: string;
  roomLabel?: string;
};

/**
 * Names the class, teacher and room a calendar is filtered to, by reading the lessons
 * that came back rather than by looking the identifiers up.
 *
 * A filter arriving in the URL is an identifier with no name attached, and the pickers
 * search a page at a time, so a restored filter would read `#7` until the chosen value
 * happened to appear in the current page of results. The sessions on screen already
 * carry every name, and they carry them for values the pickers cannot even offer — a
 * room under maintenance, a class that has finished — so this is both the cheaper and
 * the more complete answer.
 *
 * A filter that matched nothing yields no name, and the picker falls back to showing
 * the identifier, which is honest: there is nothing on screen to read a name from.
 */
export function filterLabels(
  sessions: ScheduleSession[],
  classId: number | null,
  teacherId: number | null,
  roomId: number | null,
): FilterLabels {
  const labels: FilterLabels = {};

  for (const session of sessions) {
    if (labels.classLabel === undefined && classId !== null && session.class_id === classId) {
      labels.classLabel = formatSessionClass(session);
    }

    if (labels.roomLabel === undefined && roomId !== null && session.room_id === roomId) {
      labels.roomLabel = session.room_name;
    }

    if (labels.teacherLabel === undefined && teacherId !== null) {
      const teacher = session.teachers.find(
        (candidate) => candidate.teacher_profile_id === teacherId,
      );

      if (teacher !== undefined) {
        labels.teacherLabel = teacher.teacher_name;
      }
    }
  }

  return labels;
}

/**
 * Names everybody on a session with the role each holds, for a place with room to
 * spell it out.
 */
export function formatSessionTeachers(session: ScheduleSession): string {
  if (session.teachers.length === 0) {
    return "Chưa phân giáo viên";
  }

  return session.teachers
    .map((teacher) => `${teacher.teacher_name} (${teacher.role_label})`)
    .join(", ");
}
