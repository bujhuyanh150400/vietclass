import type {
  ClassStatus,
  EmployeeStatus,
  Gender,
  GradeLevel,
  StudentStatus,
} from "../types/academic";

/**
 * Vietnamese labels for the API's integer enums.
 *
 * They live here rather than on the API's PHP enums for the same reason role
 * labels live in the identity module: the API reports stable numbers, and the
 * words shown to a reader are a presentation decision.
 *
 * Each map is exhaustive over its union, so adding a value to the API without
 * naming it here is a type error rather than a blank cell on screen.
 */

/** Whether a teacher still works here. */
export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  0: "Đang làm việc",
  1: "Đã nghỉ",
};

/** Where a student currently stands with their studies. */
export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  0: "Đang học",
  1: "Tạm nghỉ",
  2: "Dừng hẳn",
};

/** Whether a class is still running. */
export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  0: "Đang hoạt động",
  1: "Kết thúc",
};

/** A student's recorded gender. */
export const GENDER_LABELS: Record<Gender, string> = {
  0: "Nam",
  1: "Nữ",
  2: "Khác",
};

/** School grades, from the pre-primary level up to the final year. */
export const GRADE_LEVEL_LABELS: Record<GradeLevel, string> = {
  0: "Tiền tiểu học",
  1: "Lớp 1",
  2: "Lớp 2",
  3: "Lớp 3",
  4: "Lớp 4",
  5: "Lớp 5",
  6: "Lớp 6",
  7: "Lớp 7",
  8: "Lớp 8",
  9: "Lớp 9",
  10: "Lớp 10",
  11: "Lớp 11",
  12: "Lớp 12",
};

/** Every grade in ascending order, for a picker. */
export const GRADE_LEVELS: GradeLevel[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
];

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
