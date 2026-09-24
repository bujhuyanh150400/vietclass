import type { AvatarValue } from "./avatar";

/**
 * Wire types for the academic API.
 *
 * Field names stay in the API's snake_case because they are part of the wire
 * contract, matching how the Auth module treats `is_active`.
 */

/** Whether a teacher still works here. */
export type TeacherStatus = 0 | 1;

/** Where a student currently stands with their studies. */
export type StudentStatus = 0 | 1 | 2;

/** How a guardian is related to the student. */
export type GuardianRelationship = 0 | 1 | 2;

/** Whether a class is still running. */
export type ClassStatus = 0 | 1;

/** Whether a room can be assigned to a new schedule. */
export type RoomStatus = 0 | 1 | 2;

/** A fitting a room is equipped with. */
export type RoomFacility = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** A student's recorded gender. */
export type Gender = 0 | 1 | 2;

/** School grade, where `0` is the pre-primary level and `1`–`12` are grade numbers. */
export type GradeLevel =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** One entry in a combobox, as the option endpoints report it. */
export type Option = {
  id: number;
  label: string;
};

/**
 * One guardian already on file, as the guardian picker endpoint reports it.
 *
 * It carries the phone number on top of the shared option shape because two
 * guardians routinely share a name and the number is what tells them apart.
 */
export type GuardianOption = Option & {
  phone: string | null;
};

/** A subject classes can be taught in. */
export type Subject = {
  id: number;
  name: string;
  description: string | null;
  grade_levels: GradeLevel[];
  is_active: boolean;
  active_classes_count?: number;
  created_at: string | null;
  updated_at: string | null;
};

/** A teaching room managed by the Academic module. */
export type Room = {
  id: number;
  name: string;
  capacity: number;
  location: string | null;
  facilities: RoomFacility[];
  note: string | null;
  status: RoomStatus;
  created_at: string | null;
  updated_at: string | null;
};

/** A student linked from a guardian record. */
export type GuardianStudent = {
  id: number;
  full_name: string;
  grade_level: GradeLevel;
  relationship: GuardianRelationship;
  is_primary: boolean;
};

/** A role-pure guardian profile and its complete student roster. */
export type Guardian = {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  gender: Gender;
  address: string | null;
  note: string | null;
  students: GuardianStudent[];
  created_at: string | null;
  updated_at: string | null;
};

/** A subject currently taught by a teacher. */
export type TeacherSubject = {
  id: number;
  name: string;
};

/** A currently running class led by a teacher. */
export type TeacherClass = {
  id: number;
  code: string;
  name: string;
  subject_id: number | null;
  subject_name: string | null;
  status: ClassStatus;
};

/** A teacher's current assignment as an assistant rather than a lead. */
export type TeacherAssistantClass = TeacherClass;

/** One teacher attached to a class team. */
export type ClassTeacherAssignment = {
  id: number;
  name: string | null;
  status: TeacherStatus;
};

/** One subject assigned to a class, with its primary marker where available. */
export type ClassSubject = {
  id: number;
  name: string;
  is_active: boolean;
  grade_levels: GradeLevel[];
  is_primary: boolean;
};

/** A teacher profile together with the state of its login account. */
export type Teacher = {
  id: number;
  profile_id: number;
  user_id: number | null;
  avatar: AvatarValue;
  full_name: string;
  phone: string | null;
  email: string | null;
  gender: Gender;
  address: string | null;
  status: TeacherStatus;
  color_identification: string | null;
  joined_at: string | null;
  subjects: TeacherSubject[];
  classes: TeacherClass[];
  assistant_classes: TeacherAssistantClass[];
  /** Historical lead assignments; absent until the API supplies them. */
  ended_classes?: TeacherClass[];
  /** Historical assistant assignments; absent until the API supplies them. */
  ended_assistant_classes?: TeacherAssistantClass[];
  username?: string | null;
  is_account_active?: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

/** A class, with the subject and teacher it depends on resolved for display. */
export type SchoolClass = {
  id: number;
  code: string;
  name: string;
  subject_id: number;
  subject_name?: string | null;
  subjects: ClassSubject[];
  teacher_id: number;
  teacher_name?: string | null;
  teacher_status?: TeacherStatus | null;
  assistant_teachers: ClassTeacherAssignment[];
  grade_level: GradeLevel;
  max_students: number;
  active_students_count?: number;
  past_enrollments_count?: number;
  status: ClassStatus;
  start_at: string | null;
  end_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * One guardian as the student list reports it, enough to show a contact chip
 * without loading the guardian's own profile.
 *
 * A student may have several. `is_primary` marks the single main contact, and
 * the API returns that one first, because the list only shows the first few and
 * the main contact is the one worth showing.
 */
export type StudentGuardianSummary = {
  profile_id: number;
  full_name: string;
  phone: string | null;
  relationship: GuardianRelationship;
  is_primary: boolean;
};

/**
 * One class the student is currently enrolled in, as the student list reports
 * it. Only running enrolments appear, so a class the student has left is absent
 * rather than present and flagged.
 */
export type StudentEnrollmentSummary = {
  class_id: number;
  name: string;
  code: string;
  subject_name: string | null;
};

/** A student profile together with the state of its login account. */
export type Student = {
  id: number;
  profile_id: number;
  user_id: number | null;
  avatar: AvatarValue;
  full_name: string;
  phone: string | null;
  dob: string | null;
  gender: Gender;
  grade_level: GradeLevel;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_gender: Gender | null;
  guardian_relationship: GuardianRelationship | null;
  /** Every guardian, main contact first. Empty rather than absent when none. */
  guardians: StudentGuardianSummary[];
  /** Only the enrolments still running. Empty rather than absent when none. */
  active_enrollments: StudentEnrollmentSummary[];
  address: string | null;
  note: string | null;
  status: StudentStatus;
  username?: string | null;
  is_account_active?: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * One period of a student's membership in a class. A student may have several of
 * these for the same class, at most one of which is running.
 */
export type Enrollment = {
  id: number;
  class_id: number;
  student_id: number;
  student_name?: string | null;
  enrolled_at: string | null;
  left_at: string | null;
  is_active: boolean;
  note: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/** One active or historical class in a student's distinct class list. */
export type StudentClass = {
  id: number;
  code: string;
  name: string;
  grade_level: GradeLevel;
  status: ClassStatus;
  is_current: boolean;
  enrollment_periods_count: number;
  subjects: Pick<ClassSubject, "id" | "name">[];
};

/** A current class membership summary shown in the enrollment picker. */
export type EnrollmentStudentClass = {
  class_id: number;
  name: string;
  code: string;
  subjects: Pick<ClassSubject, "id" | "name">[];
};

/** One student row with current add eligibility and an explicit disabled reason. */
export type EnrollmentStudentOption = {
  id: number;
  profile_id: number;
  full_name: string;
  phone: string | null;
  grade_level: GradeLevel;
  status: StudentStatus;
  is_account_active: boolean | null;
  active_enrollments: EnrollmentStudentClass[];
  is_eligible: boolean;
  disabled_reason:
    | "account_missing"
    | "account_inactive"
    | "grade_mismatch"
    | "already_enrolled"
    | "class_full"
    | "class_ended"
    | null;
};

/** A destination class with current transfer eligibility and its complete team. */
export type TransferClassOption = {
  id: number;
  code: string;
  name: string;
  grade_level: GradeLevel;
  status: ClassStatus;
  subjects: (Pick<ClassSubject, "id" | "name"> & { is_primary: boolean })[];
  teacher: ClassTeacherAssignment | null;
  assistant_teachers: ClassTeacherAssignment[];
  current_student_count: number;
  max_students: number;
  is_eligible: boolean;
  disabled_reason:
    | "class_ended"
    | "grade_mismatch"
    | "subject_mismatch"
    | "already_enrolled"
    | "class_full"
    | null;
};

/** The enrollment period/class projection common to history events and legacy rows. */
export type EnrollmentHistoryPeriod = {
  id: number;
  class: {
    id: number;
    code: string;
    name: string;
    subjects: Pick<ClassSubject, "id" | "name">[];
  };
};

/** Persisted values captured before and after an enrollment edit event. */
export type EnrollmentSnapshot = {
  enrolled_at: string;
  left_at: string | null;
  note: string | null;
};

/** Immutable event kinds stored by the academic enrollment event table. */
export type EnrollmentHistoryEventType = 0 | 1 | 2 | 3 | 4 | 5;

type EnrollmentHistoryEventBase = {
  kind: "event";
  id: number;
  effective_on: string;
  note: string | null;
  created_at: string;
  enrollment: EnrollmentHistoryPeriod;
  related_enrollment: EnrollmentHistoryPeriod | null;
  actor: { id: number; username: string } | null;
};

/** Timeline event recorded by one successful enrollment mutation. */
export type EnrollmentHistoryEvent =
  | (EnrollmentHistoryEventBase & {
      event_type: 1;
      metadata: { before: EnrollmentSnapshot; after: EnrollmentSnapshot };
    })
  | (EnrollmentHistoryEventBase & {
      event_type: 0 | 2 | 3 | 4 | 5;
      metadata: Record<string, never>;
    });

/** Period created before detailed event history existed; no event is inferred. */
export type LegacyEnrollmentHistoryEntry = {
  kind: "legacy_enrollment";
  id: number;
  effective_on: string;
  note: string | null;
  enrollment: EnrollmentHistoryPeriod & {
    enrolled_at: string | null;
    left_at: string | null;
    note: string | null;
  };
  actor: null;
};

/** Discriminated union returned by the administrator-only per-class history API. */
export type EnrollmentHistoryEntry = EnrollmentHistoryEvent | LegacyEnrollmentHistoryEntry;
