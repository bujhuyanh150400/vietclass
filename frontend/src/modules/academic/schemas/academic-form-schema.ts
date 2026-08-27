import { z } from "zod";

/**
 * Form validation for every academic screen, mirroring the API's own rules so a
 * mistake is caught before a request is sent. The API stays authoritative: it
 * repeats every one of these checks and adds the ones that depend on other
 * records, such as capacity or whether a subject is still offered.
 */

/** A Vietnamese phone number: leading zero, then nine or ten digits. */
const PHONE_PATTERN = /^0[0-9]{9,10}$/;

/** A six-digit hex colour, as the API accepts it. */
const HEX_COLOUR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/** A date the API accepts, in `YYYY-MM-DD`. */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const requiredDate = z
  .string()
  .regex(DATE_PATTERN, { error: "Vui lòng chọn ngày hợp lệ." });

const optionalDate = z
  .string()
  .regex(DATE_PATTERN, { error: "Vui lòng chọn ngày hợp lệ." })
  .or(z.literal(""));

const optionalPhone = z
  .string()
  .regex(PHONE_PATTERN, { error: "Số điện thoại không hợp lệ." })
  .or(z.literal(""));

const password = z
  .string()
  .min(8, { error: "Mật khẩu phải có ít nhất 8 ký tự." })
  .max(255, { error: "Mật khẩu không được vượt quá 255 ký tự." });

const username = z
  .string()
  .min(1, { error: "Vui lòng nhập tên đăng nhập." })
  .max(50, { error: "Tên đăng nhập không được vượt quá 50 ký tự." });

/** Creating or editing a subject. */
export const subjectFormSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Vui lòng nhập tên môn học." })
    .max(50, { error: "Tên môn học không được vượt quá 50 ký tự." }),
  description: z
    .string()
    .max(2000, { error: "Mô tả không được vượt quá 2000 ký tự." })
    .default(""),
});

export type SubjectFormInput = z.input<typeof subjectFormSchema>;
export type SubjectFormValues = z.output<typeof subjectFormSchema>;

/** The profile fields shared by creating and editing a teacher. */
const teacherProfileShape = {
  full_name: z
    .string()
    .min(1, { error: "Vui lòng nhập họ và tên." })
    .max(255, { error: "Họ và tên không được vượt quá 255 ký tự." }),
  phone: z.string().regex(PHONE_PATTERN, { error: "Số điện thoại không hợp lệ." }),
  email: z.email({ error: "Email không hợp lệ." }).max(255),
  address: z.string().max(2000).default(""),
  status: z.union([z.literal(0), z.literal(1)]),
  color: z
    .string()
    .regex(HEX_COLOUR_PATTERN, { error: "Màu phải ở dạng mã hex, ví dụ #FD7110." })
    .or(z.literal(""))
    .default(""),
  joined_at: requiredDate,
  bank_bin: z.string().max(20).default(""),
  bank_name: z.string().max(100).default(""),
  bank_account_number: z.string().max(30).default(""),
  bank_account_holder: z.string().max(100).default(""),
};

/** Creating a teacher, which also creates the login account. */
export const teacherCreateSchema = z.object({
  ...teacherProfileShape,
  username,
  password,
});

/**
 * Editing a teacher. The profile rules are identical; the credentials become
 * optional because the edit screen does not collect them — the login name never
 * changes and the password has its own dialog.
 *
 * One schema shape covers both modes so the form fields are written once, and the
 * stricter resolver is applied only when creating.
 */
export const teacherEditSchema = z.object({
  ...teacherProfileShape,
  username: username.optional(),
  password: password.optional(),
});

export type TeacherFormInput = z.input<typeof teacherEditSchema>;
export type TeacherFormValues = z.output<typeof teacherEditSchema>;

/** The profile fields shared by creating and editing a student. */
const studentProfileShape = {
  full_name: z
    .string()
    .min(1, { error: "Vui lòng nhập họ và tên." })
    .max(255, { error: "Họ và tên không được vượt quá 255 ký tự." }),
  phone: optionalPhone.default(""),
  dob: optionalDate.default(""),
  gender: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  grade_level: z.number().int().min(0).max(12),
  parent_name: z
    .string()
    .min(1, { error: "Vui lòng nhập tên phụ huynh." })
    .max(255, { error: "Tên phụ huynh không được vượt quá 255 ký tự." }),
  parent_phone: optionalPhone.default(""),
  address: z.string().max(2000).default(""),
  note: z.string().max(2000).default(""),
  status: z.union([z.literal(0), z.literal(1), z.literal(2)]),
};

/** Creating a student, which also creates the login account. */
export const studentCreateSchema = z.object({
  ...studentProfileShape,
  username,
  password,
});

/** Editing a student, where the credentials are optional for the same reason. */
export const studentEditSchema = z.object({
  ...studentProfileShape,
  username: username.optional(),
  password: password.optional(),
});

export type StudentFormInput = z.input<typeof studentEditSchema>;
export type StudentFormValues = z.output<typeof studentEditSchema>;

/** The fields shared by creating and editing a class. */
const classShape = {
  name: z
    .string()
    .min(1, { error: "Vui lòng nhập tên lớp." })
    .max(50, { error: "Tên lớp không được vượt quá 50 ký tự." }),
  subject_id: z.number().int().min(1, { error: "Vui lòng chọn môn học." }),
  teacher_id: z.number().int().min(1, { error: "Vui lòng chọn giáo viên." }),
  grade_level: z.number().int().min(0).max(12),
  max_students: z
    .number()
    .int()
    .min(1, { error: "Sĩ số tối đa phải ít nhất 1." })
    .max(65535),
  end_at: optionalDate.default(""),
};

/** Creating a class, where the code and opening date are set for good. */
export const classCreateSchema = z.object({
  ...classShape,
  code: z
    .string()
    .min(1, { error: "Vui lòng nhập mã lớp." })
    .max(50, { error: "Mã lớp không được vượt quá 50 ký tự." }),
  start_at: requiredDate,
});

/**
 * Editing a class, which can change neither its code nor its opening date. Both
 * stay in the shape so the form fields are written once, and become optional
 * because the edit screen shows them read-only and submits neither.
 */
export const classEditSchema = z.object({
  ...classShape,
  code: z.string().optional(),
  start_at: z.string().optional(),
});

export type ClassFormInput = z.input<typeof classEditSchema>;
export type ClassFormValues = z.output<typeof classEditSchema>;

/** Correcting the dates or note on one enrolment. */
export const enrollmentUpdateSchema = z.object({
  enrolled_at: requiredDate,
  left_at: optionalDate.default(""),
  note: z.string().max(2000).default(""),
});

export type EnrollmentUpdateInput = z.input<typeof enrollmentUpdateSchema>;
export type EnrollmentUpdateValues = z.output<typeof enrollmentUpdateSchema>;

/** Moving a student to another class of the same subject. */
export const transferSchema = z.object({
  class_id: z.number().int().min(1, { error: "Vui lòng chọn lớp đích." }),
  left_at: requiredDate,
  note: z.string().max(2000).default(""),
});

export type TransferInput = z.input<typeof transferSchema>;
export type TransferValues = z.output<typeof transferSchema>;

/** Ending a student's membership of a class. */
export const leaveSchema = z.object({
  left_at: requiredDate,
  reason: z
    .string()
    .min(1, { error: "Vui lòng nhập lý do nghỉ học." })
    .max(2000, { error: "Lý do không được vượt quá 2000 ký tự." }),
});

export type LeaveInput = z.input<typeof leaveSchema>;
export type LeaveValues = z.output<typeof leaveSchema>;

/** Adding students to a class from one shared join date. */
export const enrolSchema = z.object({
  student_ids: z
    .array(z.number().int())
    .min(1, { error: "Vui lòng chọn ít nhất một học sinh." }),
  enrolled_at: requiredDate,
  note: z.string().max(2000).default(""),
});

export type EnrolInput = z.input<typeof enrolSchema>;
export type EnrolValues = z.output<typeof enrolSchema>;

/** Replacing the password on a profile's login account. */
export const passwordFormSchema = z.object({ password });

export type PasswordFormInput = z.input<typeof passwordFormSchema>;
export type PasswordFormValues = z.output<typeof passwordFormSchema>;

/**
 * Converts an optional form field to what the API expects, since a text input
 * reports an untouched field as an empty string while the API stores `null`.
 */
export function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}
