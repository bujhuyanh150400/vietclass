"use client";

import { ResourceLoader } from "@/components/shared/resource-loader";

import { useClass } from "../hooks/use-classes";
import { ClassFormContainer } from "./class-form-container";

/**
 * Loads the class being edited, then hands it to the form.
 */
export function ClassEditContainer({ classId }: { classId: number }) {
  const query = useClass(classId);

  return (
    <ResourceLoader query={query} notFoundMessage="Không tìm thấy lớp học.">
      {(schoolClass) => <ClassFormContainer schoolClass={schoolClass} />}
    </ResourceLoader>
  );
}
