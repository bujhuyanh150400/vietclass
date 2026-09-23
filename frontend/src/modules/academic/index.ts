export type {
  ClassStatus,
  Enrollment,
  Gender,
  Guardian,
  GuardianStudent,
  GradeLevel,
  GuardianOption,
  GuardianRelationship,
  Option,
  Room,
  RoomFacility,
  RoomStatus,
  SchoolClass,
  Student,
  StudentEnrollmentSummary,
  StudentGuardianSummary,
  StudentStatus,
  Subject,
  Teacher,
  TeacherStatus,
} from "./types/academic";

export type {
  CreateClassRequest,
  DeleteGuardianRequest,
  GuardianRequest,
  CreateStudentRequest,
  CreateTeacherRequest,
  EnrolStudentsRequest,
  LeaveClassRequest,
  RoomRequest,
  SubjectRequest,
  TransferEnrollmentRequest,
  UpdateClassRequest,
  UpdateEnrollmentRequest,
  UpdateStudentRequest,
  UpdateTeacherRequest,
} from "./types/academic-requests";

export {
  CLASS_STATUS_LABELS,
  GENDER_LABELS,
  GRADE_LEVELS,
  GRADE_LEVEL_LABELS,
  GUARDIAN_RELATIONSHIP_LABELS,
  STUDENT_STATUS_LABELS,
  TEACHER_STATUS_LABELS,
  ROOM_STATUS_LABELS,
  formatDate,
} from "./utils/labels";

export { SubjectsContainer } from "./containers/subjects-container";
export { SubjectFormContainer } from "./containers/subject-form-container";
export { SubjectEditContainer } from "./containers/subject-edit-container";

export { RoomsContainer } from "./containers/rooms-container";
export { RoomFormContainer } from "./containers/room-form-container";
export { RoomEditContainer } from "./containers/room-edit-container";

export { TeachersContainer } from "./containers/teachers-container";
export { GuardiansContainer } from "./containers/guardians-container";
export { GuardianDetailContainer } from "./containers/guardian-detail-container";
export { GuardianFormContainer } from "./containers/guardian-form-container";
export { GuardianEditLoader } from "./components/guardian-edit-loader";
export { GuardianForm } from "./components/guardian-form";
export { GuardianDetailView } from "./components/guardian-detail-view";
export { GuardianDeleteDialog } from "./components/guardian-delete-dialog";
export { TeacherDetailContainer } from "./containers/teacher-detail-container";
export { TeacherFormContainer } from "./containers/teacher-form-container";
export { TeacherEditContainer } from "./containers/teacher-edit-container";

export { ClassesContainer } from "./containers/classes-container";
export { ClassFormContainer } from "./containers/class-form-container";
export { ClassEditContainer } from "./containers/class-edit-container";
export { ClassDetailContainer } from "./containers/class-detail-container";

export { StudentsContainer } from "./containers/students-container";
export { StudentDetailContainer } from "./containers/student-detail-container";
export { StudentFormContainer } from "./containers/student-form-container";
export { StudentEditContainer } from "./containers/student-edit-container";

export { AvatarDraftField } from "./components/avatar-draft-field";
export { AvatarEditor } from "./components/avatar-editor";
export { SampleAvatarDialog } from "./components/sample-avatar-dialog";
export { UserAvatar } from "./components/user-avatar";
export { ProfileAvatarEditorContainer } from "./containers/profile-avatar-editor-container";
export { useUpdateProfileAvatar } from "./hooks/use-avatar";
export { AvatarDraftError, useSaveProfileAvatar } from "./hooks/use-save-profile-avatar";
export { avatarSelectionSchema, avatarValueSchema } from "./schemas/avatar-schema";
export type { AvatarCreateSelection, AvatarDraft, AvatarSelection, AvatarValue, DiceBearAvatar, DiceBearOptions, DiceBearStyle } from "./types/avatar";
export { ADVENTURER_HAIR, adventurerGender, randomAdventurer, type AvatarGender } from "./utils/adventurer";
export { renderDiceBear } from "./utils/dicebear";
