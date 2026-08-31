import { ApiClientError } from "@/lib/api/api-client-error";
import { browserRequest, browserRequestList } from "@/lib/api/browser-request";
import type { Page } from "@/lib/api/contracts";

import {
  enrollmentListSchema,
  enrollmentSchema,
  optionListSchema,
  roomListSchema,
  roomSchema,
  schoolClassListSchema,
  schoolClassSchema,
  studentListSchema,
  studentSchema,
  subjectListSchema,
  subjectSchema,
  teacherListSchema,
  teacherSchema,
} from "../schemas/academic-response-schema";
import type {
  Enrollment,
  Option,
  Room,
  SchoolClass,
  Student,
  Subject,
  Teacher,
} from "../types/academic";

/** Every academic call goes through this same-origin, allowlisted forwarder. */
const BASE = "/api/academic";

/** Query parameters a list screen sends upstream. */
type ListParams = Record<string, string | number | boolean | undefined>;

/**
 * Validates a paginated payload before it reaches a screen, so a malformed upstream
 * response becomes a service failure rather than rows that render as blanks.
 */
function parsePage<T>(page: Page<unknown>, schema: { safeParse: (v: unknown) => { success: boolean; data?: unknown } }): Page<T> {
  const parsed = schema.safeParse(page.data);

  if (!parsed.success) {
    throw ApiClientError.upstreamFailure();
  }

  return { data: parsed.data as T[], meta: page.meta };
}

/**
 * Validates a single-record payload before it reaches a screen.
 */
function parseOne<T>(value: unknown, schema: { safeParse: (v: unknown) => { success: boolean; data?: unknown } }): T {
  const parsed = schema.safeParse(value);

  if (!parsed.success) {
    throw ApiClientError.upstreamFailure();
  }

  return parsed.data as T;
}

/** Fetches one page of subjects. */
export async function fetchSubjects(params: ListParams): Promise<Page<Subject>> {
  return parsePage<Subject>(
    await browserRequestList<unknown>(`${BASE}/subjects`, { params }),
    subjectListSchema,
  );
}

/** Fetches the subjects a class may be assigned to. */
export async function fetchSubjectOptions(params: ListParams): Promise<Option[]> {
  return parseOne<Option[]>(
    await browserRequest<unknown>(`${BASE}/subjects/options`, { params }),
    optionListSchema,
  );
}

/** Fetches one subject. */
export async function fetchSubject(id: number): Promise<Subject> {
  return parseOne<Subject>(await browserRequest<unknown>(`${BASE}/subjects/${id}`), subjectSchema);
}

/** Creates a subject. */
export async function createSubject(body: unknown): Promise<Subject> {
  return parseOne<Subject>(
    await browserRequest<unknown>(`${BASE}/subjects`, { method: "POST", body }),
    subjectSchema,
  );
}

/** Changes a subject's name or description. */
export async function updateSubject(id: number, body: unknown): Promise<Subject> {
  return parseOne<Subject>(
    await browserRequest<unknown>(`${BASE}/subjects/${id}`, { method: "PUT", body }),
    subjectSchema,
  );
}

/** Locks or unlocks a subject for use by new classes. */
export async function setSubjectActive(id: number, isActive: boolean): Promise<Subject> {
  return parseOne<Subject>(
    await browserRequest<unknown>(`${BASE}/subjects/${id}/active`, {
      method: "PATCH",
      body: { is_active: isActive },
    }),
    subjectSchema,
  );
}

/** Removes a subject no class references. */
export async function deleteSubject(id: number): Promise<void> {
  await browserRequest<undefined>(`${BASE}/subjects/${id}`, { method: "DELETE" });
}

/** Fetches one page of rooms. */
export async function fetchRooms(params: ListParams): Promise<Page<Room>> {
  return parsePage<Room>(
    await browserRequestList<unknown>(`${BASE}/rooms`, { params }),
    roomListSchema,
  );
}

/** Fetches the rooms a schedule may be assigned to. */
export async function fetchRoomOptions(params: ListParams): Promise<Option[]> {
  return parseOne<Option[]>(
    await browserRequest<unknown>(`${BASE}/rooms/options`, { params }),
    optionListSchema,
  );
}

/** Fetches one room. */
export async function fetchRoom(id: number): Promise<Room> {
  return parseOne<Room>(await browserRequest<unknown>(`${BASE}/rooms/${id}`), roomSchema);
}

/** Creates a room. */
export async function createRoom(body: unknown): Promise<Room> {
  return parseOne<Room>(
    await browserRequest<unknown>(`${BASE}/rooms`, { method: "POST", body }),
    roomSchema,
  );
}

/** Changes a room's editable details. */
export async function updateRoom(id: number, body: unknown): Promise<Room> {
  return parseOne<Room>(
    await browserRequest<unknown>(`${BASE}/rooms/${id}`, { method: "PUT", body }),
    roomSchema,
  );
}

/** Changes a room's availability status. */
export async function changeRoomStatus(id: number, status: number): Promise<Room> {
  return parseOne<Room>(
    await browserRequest<unknown>(`${BASE}/rooms/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
    roomSchema,
  );
}

/** Removes a room no schedule references. */
export async function deleteRoom(id: number): Promise<void> {
  await browserRequest<undefined>(`${BASE}/rooms/${id}`, { method: "DELETE" });
}

/** Fetches one page of teacher profiles. */
export async function fetchTeachers(params: ListParams): Promise<Page<Teacher>> {
  return parsePage<Teacher>(
    await browserRequestList<unknown>(`${BASE}/teachers`, { params }),
    teacherListSchema,
  );
}

/** Fetches the teachers a class may be assigned to. */
export async function fetchTeacherOptions(params: ListParams): Promise<Option[]> {
  return parseOne<Option[]>(
    await browserRequest<unknown>(`${BASE}/teachers/options`, { params }),
    optionListSchema,
  );
}

/** Fetches one teacher profile. */
export async function fetchTeacher(id: number): Promise<Teacher> {
  return parseOne<Teacher>(await browserRequest<unknown>(`${BASE}/teachers/${id}`), teacherSchema);
}

/** Creates a teacher profile together with its login account. */
export async function createTeacher(body: unknown): Promise<Teacher> {
  return parseOne<Teacher>(
    await browserRequest<unknown>(`${BASE}/teachers`, { method: "POST", body }),
    teacherSchema,
  );
}

/** Changes a teacher profile. */
export async function updateTeacher(id: number, body: unknown): Promise<Teacher> {
  return parseOne<Teacher>(
    await browserRequest<unknown>(`${BASE}/teachers/${id}`, { method: "PUT", body }),
    teacherSchema,
  );
}

/** Locks or unlocks a teacher's login account. */
export async function setTeacherAccountActive(id: number, isActive: boolean): Promise<Teacher> {
  return parseOne<Teacher>(
    await browserRequest<unknown>(`${BASE}/teachers/${id}/account`, {
      method: "PATCH",
      body: { is_active: isActive },
    }),
    teacherSchema,
  );
}

/** Replaces the password on a teacher's login account. */
export async function changeTeacherPassword(id: number, password: string): Promise<void> {
  await browserRequest<undefined>(`${BASE}/teachers/${id}/password`, {
    method: "PATCH",
    body: { password },
  });
}

/** Fetches one page of classes. */
export async function fetchClasses(params: ListParams): Promise<Page<SchoolClass>> {
  return parsePage<SchoolClass>(
    await browserRequestList<unknown>(`${BASE}/classes`, { params }),
    schoolClassListSchema,
  );
}

/** Fetches the classes still running. */
export async function fetchClassOptions(params: ListParams): Promise<Option[]> {
  return parseOne<Option[]>(
    await browserRequest<unknown>(`${BASE}/classes/options`, { params }),
    optionListSchema,
  );
}

/** Fetches one class. */
export async function fetchClass(id: number): Promise<SchoolClass> {
  return parseOne<SchoolClass>(
    await browserRequest<unknown>(`${BASE}/classes/${id}`),
    schoolClassSchema,
  );
}

/** Creates a class. */
export async function createClass(body: unknown): Promise<SchoolClass> {
  return parseOne<SchoolClass>(
    await browserRequest<unknown>(`${BASE}/classes`, { method: "POST", body }),
    schoolClassSchema,
  );
}

/** Changes a class. */
export async function updateClass(id: number, body: unknown): Promise<SchoolClass> {
  return parseOne<SchoolClass>(
    await browserRequest<unknown>(`${BASE}/classes/${id}`, { method: "PUT", body }),
    schoolClassSchema,
  );
}

/** Moves a class between the running and finished states. */
export async function changeClassStatus(id: number, status: number): Promise<SchoolClass> {
  return parseOne<SchoolClass>(
    await browserRequest<unknown>(`${BASE}/classes/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
    schoolClassSchema,
  );
}

/** Fetches one page of student profiles. */
export async function fetchStudents(params: ListParams): Promise<Page<Student>> {
  return parsePage<Student>(
    await browserRequestList<unknown>(`${BASE}/students`, { params }),
    studentListSchema,
  );
}

/** Fetches one student profile. */
export async function fetchStudent(id: number): Promise<Student> {
  return parseOne<Student>(await browserRequest<unknown>(`${BASE}/students/${id}`), studentSchema);
}

/** Creates a student profile together with its login account. */
export async function createStudent(body: unknown): Promise<Student> {
  return parseOne<Student>(
    await browserRequest<unknown>(`${BASE}/students`, { method: "POST", body }),
    studentSchema,
  );
}

/** Changes a student profile. */
export async function updateStudent(id: number, body: unknown): Promise<Student> {
  return parseOne<Student>(
    await browserRequest<unknown>(`${BASE}/students/${id}`, { method: "PUT", body }),
    studentSchema,
  );
}

/** Locks or unlocks a student's login account. */
export async function setStudentAccountActive(id: number, isActive: boolean): Promise<Student> {
  return parseOne<Student>(
    await browserRequest<unknown>(`${BASE}/students/${id}/account`, {
      method: "PATCH",
      body: { is_active: isActive },
    }),
    studentSchema,
  );
}

/** Replaces the password on a student's login account. */
export async function changeStudentPassword(id: number, password: string): Promise<void> {
  await browserRequest<undefined>(`${BASE}/students/${id}/password`, {
    method: "PATCH",
    body: { password },
  });
}

/** Fetches one page of a class roster. */
export async function fetchEnrollments(
  classId: number,
  params: ListParams,
): Promise<Page<Enrollment>> {
  return parsePage<Enrollment>(
    await browserRequestList<unknown>(`${BASE}/classes/${classId}/enrollments`, { params }),
    enrollmentListSchema,
  );
}

/** Fetches the students who may still be added to a class. */
export async function fetchAvailableStudents(
  classId: number,
  params: ListParams,
): Promise<Page<Student>> {
  return parsePage<Student>(
    await browserRequestList<unknown>(`${BASE}/classes/${classId}/available-students`, { params }),
    studentListSchema,
  );
}

/** Enrols one or more students into a class. */
export async function enrolStudents(classId: number, body: unknown): Promise<Enrollment[]> {
  return parseOne<Enrollment[]>(
    await browserRequest<unknown>(`${BASE}/classes/${classId}/enrollments`, {
      method: "POST",
      body,
    }),
    enrollmentListSchema,
  );
}

/** Corrects the dates or note on one enrolment. */
export async function updateEnrollment(id: number, body: unknown): Promise<Enrollment> {
  return parseOne<Enrollment>(
    await browserRequest<unknown>(`${BASE}/enrollments/${id}`, { method: "PUT", body }),
    enrollmentSchema,
  );
}

/** Moves a student to another class of the same subject. */
export async function transferEnrollment(id: number, body: unknown): Promise<Enrollment> {
  return parseOne<Enrollment>(
    await browserRequest<unknown>(`${BASE}/enrollments/${id}/transfer`, { method: "POST", body }),
    enrollmentSchema,
  );
}

/** Ends a student's membership of a class. */
export async function leaveClass(id: number, body: unknown): Promise<Enrollment> {
  return parseOne<Enrollment>(
    await browserRequest<unknown>(`${BASE}/enrollments/${id}/leave`, { method: "POST", body }),
    enrollmentSchema,
  );
}
