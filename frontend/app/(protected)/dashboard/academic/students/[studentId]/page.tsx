import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StudentEditContainer } from "@/modules/academic";

export const metadata: Metadata = {
  title: "Sửa hồ sơ học sinh",
};

/**
 * Renders the screen for editing one student profile.
 *
 * A path segment that is not a number never reaches the API: it cannot identify a
 * record, so it is a wrong URL rather than a missing student.
 */
export default async function EditStudentPage({
  params,
}: PageProps<"/dashboard/academic/students/[studentId]">) {
  const { studentId } = await params;
  const id = Number(studentId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  return <StudentEditContainer studentId={id} />;
}
