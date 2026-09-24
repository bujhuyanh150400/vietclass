import type { GradeLevel, TeacherStatus } from "../types/academic";

export type EnrollmentStudentDisabledReason =
  | "account_missing"
  | "account_inactive"
  | "grade_mismatch"
  | "already_enrolled"
  | "class_full"
  | "class_ended";

export type TransferDisabledReason =
  | "class_ended"
  | "grade_mismatch"
  | "subject_mismatch"
  | "already_enrolled"
  | "class_full";

/** Give a student-picker reason readable Vietnamese copy. */
export function enrollmentStudentDisabledReason(reason: EnrollmentStudentDisabledReason): string {
  switch (reason) {
    case "account_missing":
      return "Chưa có tài khoản đăng nhập.";
    case "account_inactive":
      return "Tài khoản đang bị khóa.";
    case "grade_mismatch":
      return "Không cùng khối với lớp.";
    case "already_enrolled":
      return "Đang học trong lớp này.";
    case "class_full":
      return "Lớp đã đủ sĩ số.";
    case "class_ended":
      return "Lớp đã kết thúc.";
  }
}

/** Give a transfer-picker reason readable Vietnamese copy. */
export function transferDisabledReason(reason: TransferDisabledReason): string {
  switch (reason) {
    case "class_ended":
      return "Lớp đã kết thúc.";
    case "grade_mismatch":
      return "Không cùng khối với học sinh.";
    case "subject_mismatch":
      return "Không trùng toàn bộ tập môn học.";
    case "already_enrolled":
      return "Học sinh đang học trong lớp này.";
    case "class_full":
      return "Lớp đã đủ sĩ số.";
  }
}

/** Explain why a subject cannot be newly added to a class. */
export function subjectDisabledReason(
  isActive: boolean,
  gradeLevels: GradeLevel[],
  gradeLevel: GradeLevel | null,
): string | null {
  if (!isActive) return "Môn đã khóa.";
  if (gradeLevel === null) return "Chọn khối lớp trước.";
  if (!gradeLevels.includes(gradeLevel)) return "Môn không áp dụng cho khối đã chọn.";

  return null;
}

/** Prevent assigning an inactive teacher or giving one person both team roles. */
export function teacherDisabledReason(
  status: TeacherStatus,
  teacherId: number,
  leadTeacherId: number | null,
): string | null {
  if (status !== 0) return "Giáo viên đã nghỉ.";
  if (teacherId === leadTeacherId) return "Đang là giáo viên phụ trách.";

  return null;
}
