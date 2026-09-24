import type { UserRole } from "@/modules/auth";

/** Distinguish current membership from past attendance, regardless of class lifecycle status. */
export function studentClassStatusLabel(isCurrent: boolean): "Đang học" | "Đã rời" {
  return isCurrent ? "Đang học" : "Đã rời";
}

/** Require both the Admin role and the existing student.view capability for history UI. */
export function canViewStudentEnrollmentHistory(
  role: UserRole | null,
  features: readonly string[],
): boolean {
  return role === 0 && features.includes("student.view");
}
