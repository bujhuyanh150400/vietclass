"use client";

import { ResourceLoader } from "../components/resource-loader";
import { useTeacher } from "../hooks/use-teachers";
import { TeacherFormContainer } from "./teacher-form-container";

/**
 * Loads the teacher being edited, then hands the profile to the form.
 */
export function TeacherEditContainer({ teacherId }: { teacherId: number }) {
  const query = useTeacher(teacherId);

  return (
    <ResourceLoader query={query} notFoundMessage="Không tìm thấy giáo viên.">
      {(teacher) => <TeacherFormContainer teacher={teacher} />}
    </ResourceLoader>
  );
}
