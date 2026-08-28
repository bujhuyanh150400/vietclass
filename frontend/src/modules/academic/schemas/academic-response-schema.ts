import { z } from "zod";

/**
 * Validates every academic payload Laravel returns.
 *
 * The forwarding route is transport only — it hands the API's answer straight
 * back — so this is the boundary that decides whether a payload is usable. A
 * shape that does not match becomes a service failure rather than a screen of
 * blanks.
 */

/** Integer enums the API reports as numbers. */
const teacherStatus = z.union([z.literal(0), z.literal(1)]);
const studentStatus = z.union([z.literal(0), z.literal(1), z.literal(2)]);
const classStatus = z.union([z.literal(0), z.literal(1)]);
const gender = z.union([z.literal(0), z.literal(1), z.literal(2)]);
const gradeLevel = z.union([
  z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4),
  z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(9),
  z.literal(10), z.literal(11), z.literal(12),
]);

const timestamps = {
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
};

/** One entry in a combobox. */
export const optionSchema = z.object({
  id: z.number().int(),
  label: z.string(),
});

/** A list of combobox entries. */
export const optionListSchema = z.array(optionSchema);

/** A subject classes can be taught in. */
export const subjectSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  active_classes_count: z.number().int().optional(),
  ...timestamps,
});

/** A page of subjects. */
export const subjectListSchema = z.array(subjectSchema);

/** A teacher profile with the state of its login account. */
export const teacherSchema = z.object({
  id: z.number().int(),
  user_id: z.number().nullable(),
  full_name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  gender,
  address: z.string().nullable(),
  status: teacherStatus,
  color_identification: z.string().nullable(),
  joined_at: z.string().nullable(),
  username: z.string().optional(),
  is_account_active: z.boolean().optional(),
  ...timestamps,
});

/** A page of teacher profiles. */
export const teacherListSchema = z.array(teacherSchema);

/** A class with its subject and teacher resolved for display. */
export const schoolClassSchema = z.object({
  id: z.number().int(),
  code: z.string(),
  name: z.string(),
  subject_id: z.number().int(),
  subject_name: z.string().nullable().optional(),
  teacher_id: z.number().int(),
  teacher_name: z.string().nullable().optional(),
  grade_level: gradeLevel,
  max_students: z.number().int(),
  active_students_count: z.number().int().optional(),
  status: classStatus,
  start_at: z.string().nullable(),
  end_at: z.string().nullable(),
  ...timestamps,
});

/** A page of classes. */
export const schoolClassListSchema = z.array(schoolClassSchema);

/** A student profile with the state of its login account. */
export const studentSchema = z.object({
  id: z.number().int(),
  user_id: z.number().nullable(),
  full_name: z.string(),
  phone: z.string().nullable(),
  dob: z.string().nullable(),
  gender,
  grade_level: gradeLevel,
  guardian_name: z.string().nullable(),
  guardian_phone: z.string().nullable(),
  guardian_gender: z.number().nullable(),
  guardian_relationship: z.number().nullable(),
  address: z.string().nullable(),
  note: z.string().nullable(),
  status: studentStatus,
  username: z.string().optional(),
  is_account_active: z.boolean().optional(),
  ...timestamps,
});

/** A page of student profiles. */
export const studentListSchema = z.array(studentSchema);

/** One period of a student's membership in a class. */
export const enrollmentSchema = z.object({
  id: z.number().int(),
  class_id: z.number().int(),
  student_id: z.number().int(),
  student_name: z.string().nullable().optional(),
  enrolled_at: z.string().nullable(),
  left_at: z.string().nullable(),
  is_active: z.boolean(),
  note: z.string().nullable(),
  ...timestamps,
});

/** A page of membership periods. */
export const enrollmentListSchema = z.array(enrollmentSchema);
