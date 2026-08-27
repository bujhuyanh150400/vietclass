"use client";

import { ResourceLoader } from "../components/resource-loader";
import { useStudent } from "../hooks/use-students";
import { StudentFormContainer } from "./student-form-container";

/**
 * Loads the student being edited, then hands the profile to the form.
 */
export function StudentEditContainer({ studentId }: { studentId: number }) {
  const query = useStudent(studentId);

  return (
    <ResourceLoader query={query} notFoundMessage="Không tìm thấy học sinh.">
      {(student) => <StudentFormContainer student={student} />}
    </ResourceLoader>
  );
}
