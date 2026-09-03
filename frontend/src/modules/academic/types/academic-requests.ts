import type {
  Gender,
  GradeLevel,
  GuardianRelationship,
  StudentStatus,
  TeacherStatus,
} from "./academic";

/** Payload accepted by the subject create and update endpoints. */
export type SubjectRequest = {
  name: string;
  description: string | null;
};

/** Payload accepted by the room create and update endpoints. */
export type RoomRequest = {
  name: string;
  capacity: number;
  note: string | null;
};

type TeacherProfileRequest = {
  full_name: string;
  phone: string;
  email: string;
  gender: Gender;
  address: string | null;
  status: TeacherStatus;
  color_identification: string | null;
  joined_at: string;
};

/** Payload accepted by the teacher create endpoint. */
export type CreateTeacherRequest = TeacherProfileRequest & {
  username: string;
  password: string;
};

/** Payload accepted by the teacher update endpoint. */
export type UpdateTeacherRequest = TeacherProfileRequest;

type StudentProfileRequest = {
  full_name: string;
  phone: string | null;
  dob: string | null;
  gender: Gender;
  grade_level: GradeLevel;
  guardian_name: string;
  guardian_gender: Gender;
  guardian_relationship: GuardianRelationship;
  guardian_phone: string | null;
  address: string | null;
  note: string | null;
  status: StudentStatus;
};

/** Payload accepted by the student create endpoint. */
export type CreateStudentRequest = StudentProfileRequest & {
  username: string;
  password: string;
};

/** Payload accepted by the student update endpoint. */
export type UpdateStudentRequest = StudentProfileRequest;

type ClassRequest = {
  name: string;
  subject_id: number;
  teacher_id: number;
  grade_level: GradeLevel;
  max_students: number;
  end_at: string | null;
};

/** Payload accepted by the class create endpoint. */
export type CreateClassRequest = ClassRequest & {
  code: string;
  start_at: string;
};

/** Payload accepted by the class update endpoint. */
export type UpdateClassRequest = ClassRequest;

/** Payload accepted when adding students to a class. */
export type EnrolStudentsRequest = {
  student_ids: number[];
  enrolled_at: string;
  note?: string | null;
};

/** Payload accepted when correcting one enrolment period. */
export type UpdateEnrollmentRequest = {
  enrolled_at: string;
  left_at: string | null;
  note: string | null;
};

/** Payload accepted when transferring one enrolment. */
export type TransferEnrollmentRequest = {
  class_id: number;
  left_at: string;
  note: string | null;
};

/** Payload accepted when ending one enrolment. */
export type LeaveClassRequest = {
  left_at: string;
  reason: string;
};
