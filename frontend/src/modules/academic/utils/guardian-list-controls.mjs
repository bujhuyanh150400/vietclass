/** Deny Teacher mutations regardless of grants while preserving feature-based Admin access. */
export function guardianCanMutate(role, hasFeature) {
  return role !== 1 && hasFeature;
}

export const GUARDIAN_LIST_SORT_LABELS = {
  newest: "Mới thêm",
  "date-asc": "Cũ nhất",
  "name-asc": "Tên A–Z",
  "name-desc": "Tên Z–A",
};

/** Converts visible guardian controls to the explicit API query contract. */
export function buildGuardianListParams(controls) {
  const sort = controls.sort ?? "newest";
  const ordering = {
    newest: { sort: "created_at", direction: "desc" },
    "date-asc": { sort: "created_at", direction: "asc" },
    "name-asc": { sort: "full_name", direction: "asc" },
    "name-desc": { sort: "full_name", direction: "desc" },
  };

  return {
    ...(controls.q?.trim() ? { q: controls.q.trim() } : {}),
    ...(controls.page === undefined ? {} : { page: controls.page }),
    ...(controls.perPage === undefined ? {} : { per_page: controls.perPage }),
    ...ordering[sort],
  };
}

/** Return every linked student id so replacement data is never limited to a paged list. */
export function buildGuardianStudentFetchPlan(studentIds) {
  return [...new Set(studentIds)];
}

/** Check that every affected primary link has a loaded, valid replacement selection. */
export function guardianReplacementRequirementsMet(guardianId, linkedStudentIds, students, roster, replacements = {}) {
  if (students.length !== linkedStudentIds.length || !linkedStudentIds.every((id) => students.some((student) => student.id === id))) return false;
  return students.every((student) => {
    const current = student.guardians.find((guardian) => guardian.profile_id === guardianId);
    const row = roster.find((entry) => entry.student_profile_id === student.id);
    if (!current?.is_primary || row?.is_primary === true) return true;
    const candidates = student.guardians.filter((guardian) => guardian.profile_id !== guardianId);
    if (candidates.length === 0) return true;
    return candidates.some((candidate) => candidate.profile_id === replacements[student.id]);
  });
}

/** Check that deletion has a valid replacement for every affected primary student. */
export function guardianDeleteRequirementsMet(guardianId, linkedStudentIds, students, replacements = {}) {
  if (students.length !== linkedStudentIds.length || !linkedStudentIds.every((id) => students.some((student) => student.id === id))) return false;
  return students.every((student) => {
    const current = student.guardians.find((guardian) => guardian.profile_id === guardianId);
    const candidates = student.guardians.filter((guardian) => guardian.profile_id !== guardianId);
    if (!current?.is_primary || candidates.length === 0) return true;
    return candidates.some((candidate) => candidate.profile_id === replacements[student.id]);
  });
}

/** Format the contact facts shown on the guardian detail view. */
export function guardianDetailProfileFacts(guardian) {
  return [
    { label: "Số điện thoại", value: guardian.phone },
    { label: "Email", value: guardian.email ?? "—" },
    { label: "Giới tính", value: ["Nam", "Nữ", "Khác"][guardian.gender] },
    { label: "Địa chỉ", value: guardian.address ?? "—" },
    { label: "Ghi chú", value: guardian.note ?? "—" },
  ];
}

/** Format one linked student for the guardian detail roster. */
export function guardianDetailStudentLabel(student) {
  const grade = student.grade_level === 0 ? "Tiền tiểu học" : `Lớp ${student.grade_level}`;
  const relationship = ["Bố", "Mẹ", "Người giám hộ"][student.relationship];
  return `${grade} · ${relationship}`;
}

/** Update one roster row without changing another student's primary flag. */
export function toggleGuardianStudent(roster, studentProfileId, changes) {
  return roster.map((row) => row.student_profile_id === studentProfileId ? { ...row, ...changes } : row);
}

/** Reset search and paging while retaining a deterministic default sort. */
export function resetGuardianListControls() {
  return { q: "", page: 1, sort: "newest" };
}

export const GUARDIAN_OPTION_LIMIT = 50;
export const GENDER_LABELS = { 0: "Nam", 1: "Nữ", 2: "Khác" };

/** Keep only replacement choices that correspond to a student's linked guardians. */
export function guardianReplacementChoices(student, removedGuardianId) {
  return (student.guardians ?? []).filter((guardian) => guardian.profile_id !== removedGuardianId);
}

/** Submit only replacement choices that affect a removed or demoted roster row. */
export function buildGuardianUpdatePayload(values) {
  const activeRows = new Map(values.students.map((student) => [student.student_profile_id, student]));
  const replacements = Object.fromEntries(
    Object.entries(values.replacements ?? {}).filter(([studentId]) => {
      const row = activeRows.get(Number(studentId));
      return row === undefined || row.is_primary === false;
    }),
  );

  return {
    students: values.students,
    ...(Object.keys(replacements).length > 0 ? { replacements } : {}),
  };
}
