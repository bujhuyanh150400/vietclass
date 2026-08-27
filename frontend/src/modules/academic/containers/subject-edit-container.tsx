"use client";

import { ResourceLoader } from "../components/resource-loader";
import { useSubject } from "../hooks/use-subjects";
import { SubjectFormContainer } from "./subject-form-container";

/**
 * Loads the subject being edited, then hands it to the form once it has arrived.
 *
 * The form is only mounted with real values, because react-hook-form takes its
 * default values once and mounting early would leave the fields empty.
 */
export function SubjectEditContainer({ subjectId }: { subjectId: number }) {
  const query = useSubject(subjectId);

  return (
    <ResourceLoader query={query} notFoundMessage="Không tìm thấy môn học.">
      {(subject) => <SubjectFormContainer subject={subject} />}
    </ResourceLoader>
  );
}
