import type { AvatarValue } from "@/modules/avatar";

/**
 * Wire types for the academic API.
 *
 * Field names stay in the API's snake_case because they are part of the wire
 * contract, matching how the identity module treats `is_active`.
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

/** A subject classes can be taught in. */
export type Subject = {
  id: number;
  name: string;
  description: string | null;
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
  note: string | null;
  status: RoomStatus;
  created_at: string | null;
  updated_at: string | null;
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
  teacher_id: number;
  teacher_name?: string | null;
  grade_level: GradeLevel;
  max_students: number;
  active_students_count?: number;
  status: ClassStatus;
  start_at: string | null;
  end_at: string | null;
  created_at: string | null;
  updated_at: string | null;
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
