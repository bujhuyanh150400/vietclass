import type { AvatarCreateSelection } from "./avatar";

import type {
  ClassStatus,
  Gender,
  GradeLevel,
  GuardianRelationship,
  RoomFacility,
  RoomStatus,
  StudentStatus,
  TeacherStatus,
} from "./academic";

/** One complete student link in a guardian mutation payload. */
export type GuardianStudentRequest = {
  student_profile_id: number;
  relationship: GuardianRelationship;
  is_primary: boolean;
};

/** Payload accepted by guardian create and update endpoints. */
export type GuardianRequest = {
  full_name: string;
  phone: string;
  email: string | null;
  gender: Gender;
  address: string | null;
  note: string | null;
  students: GuardianStudentRequest[];
  /** Replacement guardian ids keyed by students losing this guardian as primary. */
  replacements?: Record<number, number>;
};

/** Student replacement ids used by guardian deletion. */
export type DeleteGuardianRequest = {
  replacements?: Record<number, number>;
};

/** Payload accepted by the subject create and update endpoints. */
export type SubjectRequest = {
  name: string;
  description: string | null;
  grade_levels: GradeLevel[];
  is_active: boolean;
};

/** Payload accepted by the room create and update endpoints. */
export type RoomRequest = {
  name: string;
  capacity: number;
  location: string | null;
  facilities: RoomFacility[];
  note: string | null;
  status: RoomStatus;
};

type TeacherProfileRequest = {
  full_name: string;
  phone: string;
  email: string | null;
  gender: Gender;
  address: string | null;
  status: TeacherStatus;
  color_identification?: string | null;
  joined_at: string;
};

/** Payload accepted by the teacher create endpoint. */
export type CreateTeacherRequest = TeacherProfileRequest & {
  username: string;
  password: string;
  avatar?: AvatarCreateSelection;
};

/** Payload accepted by the teacher update endpoint. */
export type UpdateTeacherRequest = TeacherProfileRequest & {
  replacement_teacher_ids?: Record<number, number>;
};

type StudentProfileRequest = {
  full_name: string;
  phone: string | null;
  dob: string | null;
  gender: Gender;
  grade_level: GradeLevel;
  address: string | null;
  note: string | null;
  status: StudentStatus;
};

/**
 * One person on a student's guardian roster.
 *
 * Each entry links an existing guardian profile. Contact data is managed by Guardian
 * CRUD, so student forms never create or reuse profiles from typed fields.
 *
 * `is_primary` marks the main contact. A non-empty roster must declare exactly one
 * primary entry; the API never chooses one implicitly.
 */
export type StudentGuardianEntry = {
  guardian_profile_id: number;
  relationship: GuardianRelationship;
  is_primary: boolean;
};

/**
 * The guardian half of a student payload.
 *
 * The API reads the roster as the complete list of who the student is linked to, so
 * leaving somebody out unlinks them. The key is optional as a whole: omitting it
 * entirely leaves every existing link alone, while an empty array says "nobody".
 */
type StudentGuardianRequest = {
  guardians?: StudentGuardianEntry[];
};

/** Payload accepted by the student create endpoint. */
export type CreateStudentRequest = StudentProfileRequest &
  StudentGuardianRequest & {
    username: string;
    password: string;
    avatar?: AvatarCreateSelection;
  };

/**
 * One profile create request together with the image a `file` avatar uploads. The
 * request is sent as JSON unless the file is there, which turns it into multipart.
 */
export type CreateProfileSubmission<TPayload> = {
  payload: TPayload;
  avatar_file?: File;
};

/**
 * Payload accepted by the student update endpoint, which takes the same roster the
 * create endpoint does: adding, removing, and moving the main contact are all
 * expressed by sending the list the student should end up with.
 */
export type UpdateStudentRequest = StudentProfileRequest & StudentGuardianRequest;

type ClassRequest = {
  name: string;
  subject_id: number;
  subject_ids?: number[];
  teacher_id: number;
  assistant_teacher_ids?: number[];
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

/** Query parameters accepted by the class list endpoint. */
export type ClassListRequest = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "code" | "name" | "start_at" | "created_at";
  direction?: "asc" | "desc";
  [key: `status[${number}]`]: ClassStatus;
  [key: `subject_id[${number}]`]: number;
  [key: `teacher_id[${number}]`]: number;
  [key: `grade_level[${number}]`]: GradeLevel;
};

/** Query parameters accepted by the class option endpoint. */
export type ClassOptionRequest = { q?: string; limit?: number };

/** Query parameters accepted by the subject list endpoint. */
export type SubjectListRequest = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "name" | "created_at" | "active_classes_count";
  direction?: "asc" | "desc";
  is_active?: boolean | 0 | 1;
  grade_level?: GradeLevel;
};

/** Query parameters accepted by the subject option endpoint. */
export type SubjectOptionRequest = { q?: string; limit?: number };

/** Query parameters accepted by the teacher list endpoint. */
export type TeacherListRequest = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "full_name" | "joined_at" | "created_at";
  direction?: "asc" | "desc";
  is_active?: boolean | 0 | 1;
  subject_id?: number | number[];
  class_id?: number | number[];
  joined_from?: string;
  joined_to?: string;
  [key: `status[${number}]`]: TeacherStatus;
};

/** Query parameters accepted by the teacher option endpoint. */
export type TeacherOptionRequest = { q?: string; limit?: number };

/** Query parameters accepted by the student list endpoint. */
export type StudentListRequest = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "full_name" | "grade_level" | "created_at";
  direction?: "asc" | "desc";
  is_active?: boolean | 0 | 1;
  [key: `status[${number}]`]: StudentStatus;
  [key: `grade_level[${number}]`]: GradeLevel;
};

/** Search and paging accepted by the eligible-student endpoint. */
export type AvailableStudentListRequest = StudentListRequest;

/** Search and paging accepted by the legacy class roster endpoint. */
export type EnrollmentListRequest = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "enrolled_at" | "left_at";
  direction?: "asc" | "desc";
  active_only?: boolean | 0 | 1;
  left_only?: boolean | 0 | 1;
  has_note?: boolean | 0 | 1;
};

/** Search and paging accepted by the disabled-aware add-student picker. */
export type EnrollmentStudentOptionsRequest = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "full_name" | "grade_level";
  direction?: "asc" | "desc";
};

/** Search and paging accepted by the transfer-destination picker. */
export type TransferOptionsRequest = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "code" | "name" | "max_students";
  direction?: "asc" | "desc";
};

/** Search and paging accepted by the distinct student class-list endpoint. */
export type StudentClassesRequest = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "code" | "name" | "grade_level" | "created_at";
  direction?: "asc" | "desc";
};

/** Query contract for one student's event and legacy history in a specific class. */
export type StudentEnrollmentHistoryRequest = {
  class_id: number;
  page?: number;
  per_page?: number;
  sort?: "effective_on" | "created_at" | "id";
  direction?: "asc" | "desc";
};

/** Query parameters accepted by the guardian list endpoint. */
export type GuardianListRequest = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "full_name" | "created_at";
  direction?: "asc" | "desc";
};

/** Query parameters accepted by the guardian option endpoint. */
export type GuardianOptionRequest = { q?: string; limit?: number };

/** Query parameters accepted by the room list endpoint. */
export type RoomListRequest = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "name" | "capacity" | "created_at";
  direction?: "asc" | "desc";
  status?: RoomStatus;
  facilities?: RoomFacility[];
  capacity_min?: number;
  capacity_max?: number;
};

/** Query parameters accepted by the room option endpoint. */
export type RoomOptionRequest = { q?: string; limit?: number };
