import type {
  EnrollmentHistoryEntry,
  EnrollmentHistoryEventType,
} from "../types/academic";

const EVENT_LABELS: Record<EnrollmentHistoryEventType, string> = {
  0: "Ghi danh",
  1: "Cập nhật ghi danh",
  2: "Nghỉ học",
  3: "Chuyển lớp đi",
  4: "Chuyển lớp đến",
  5: "Kết thúc cùng lớp",
};

type UpdatedField = "enrolled_at" | "left_at" | "note";

/** One field that changed in an update event, without exposing raw metadata. */
export type EnrollmentUpdateChange = {
  field: UpdatedField;
  before: string | null;
  after: string | null;
};

/** Return Vietnamese UI copy for one persisted event type. */
export function enrollmentEventLabel(type: EnrollmentHistoryEventType): string {
  return EVENT_LABELS[type];
}

/** Summarize a real event or explicitly identify a period with legacy-only history. */
export function enrollmentHistorySummary(entry: EnrollmentHistoryEntry): string {
  return entry.kind === "legacy_enrollment"
    ? "Lịch sử ghi danh cũ · không có nhật ký chi tiết"
    : enrollmentEventLabel(entry.event_type);
}

/** Return classes in source-to-destination order for a transfer timeline entry. */
export function enrollmentHistoryClassPath(
  entry: EnrollmentHistoryEntry,
): EnrollmentHistoryEntry["enrollment"]["class"][] {
  const currentClass = entry.enrollment.class;

  if (
    entry.kind !== "event" ||
    entry.related_enrollment === null ||
    (entry.event_type !== 3 && entry.event_type !== 4)
  ) {
    return [currentClass];
  }

  const relatedClass = entry.related_enrollment.class;

  return entry.event_type === 3
    ? [currentClass, relatedClass]
    : [relatedClass, currentClass];
}

/** Return only the before/after fields that differ in an update event. */
export function enrollmentUpdateChanges(entry: EnrollmentHistoryEntry): EnrollmentUpdateChange[] {
  if (entry.kind !== "event" || entry.event_type !== 1) return [];

  const fields: UpdatedField[] = ["enrolled_at", "left_at", "note"];

  return fields.flatMap((field) => {
    const before = entry.metadata.before[field];
    const after = entry.metadata.after[field];

    return before === after ? [] : [{ field, before, after }];
  });
}
