import type { Teacher } from "../types/academic";

/** Split active lead and assistant assignments for the retirement confirmation. */
export function teacherOffboardingAssignments(teacher: Pick<Teacher, "classes" | "assistant_classes">): {
  leadClassIds: number[];
  assistantClassIds: number[];
} {
  return {
    leadClassIds: teacher.classes
      .filter((schoolClass) => schoolClass.status === 0)
      .map((schoolClass) => schoolClass.id)
      .sort((left, right) => left - right),
    assistantClassIds: teacher.assistant_classes
      .filter((schoolClass) => schoolClass.status === 0)
      .map((schoolClass) => schoolClass.id)
      .sort((left, right) => left - right),
  };
}

/** Require one different replacement teacher for each active lead assignment. */
export function canConfirmTeacherOffboarding(
  leadClassIds: number[],
  replacements: Record<number, number | undefined>,
  retiringTeacherId: number,
): boolean {
  return leadClassIds.every((classId) => {
    const replacement = replacements[classId];

    return typeof replacement === "number" && replacement > 0 && replacement !== retiringTeacherId;
  });
}
