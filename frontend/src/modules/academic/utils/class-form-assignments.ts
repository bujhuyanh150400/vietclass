/** Toggle one subject while preserving a valid, selected primary subject. */
export function toggleClassSubject(
  subjectIds: number[],
  primarySubjectId: number,
  subjectId: number,
): { subjectIds: number[]; primarySubjectId: number } {
  const nextIds = subjectIds.includes(subjectId)
    ? subjectIds.filter((id) => id !== subjectId)
    : [...subjectIds, subjectId];
  const nextPrimarySubjectId = nextIds.includes(primarySubjectId)
    ? primarySubjectId
    : (nextIds[0] ?? 0);

  return { subjectIds: nextIds, primarySubjectId: nextPrimarySubjectId };
}

/** Change the primary subject only when it remains part of the complete set. */
export function choosePrimaryClassSubject(subjectIds: number[], subjectId: number): number {
  return subjectIds.includes(subjectId) ? subjectId : (subjectIds[0] ?? 0);
}

/** Detect a change in class subject membership regardless of order or primary marker. */
export function classSubjectSetChanged(before: number[], after: number[]): boolean {
  return before.length !== after.length || before.some((id) => !after.includes(id));
}

/** Toggle one assistant without allowing the lead teacher to acquire both roles. */
export function toggleAssistantTeacher(
  assistantTeacherIds: number[],
  teacherId: number,
  leadTeacherId: number,
): number[] {
  if (teacherId === leadTeacherId) return assistantTeacherIds;

  return assistantTeacherIds.includes(teacherId)
    ? assistantTeacherIds.filter((id) => id !== teacherId)
    : [...assistantTeacherIds, teacherId].sort((left, right) => left - right);
}
