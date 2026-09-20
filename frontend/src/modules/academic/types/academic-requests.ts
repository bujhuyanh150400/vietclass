import type { AvatarCreateSelection } from "./avatar";

import type {
  Gender,
  GradeLevel,
  GuardianRelationship,
  RoomFacility,
  RoomStatus,
  StudentStatus,
  TeacherStatus,
} from "./academic";

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
export type UpdateTeacherRequest = TeacherProfileRequest;

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
 * Each entry is one of two shapes, told apart by which keys it carries: an
 * identifier links somebody already on file, while a name and gender record somebody
 * new. Sending keys from both is refused, so the unused half is omitted rather than
 * nulled. `relationship` is required either way.
 *
 * `is_primary` marks the main contact. At most one entry may carry it; when none
 * does, the API takes the first.
 */
export type StudentGuardianEntry =
  | {
      guardian_profile_id: number;
      relationship: GuardianRelationship;
      is_primary?: boolean;
    }
  | {
      name: string;
      gender: Gender;
      phone?: string | null;
      relationship: GuardianRelationship;
      is_primary?: boolean;
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
