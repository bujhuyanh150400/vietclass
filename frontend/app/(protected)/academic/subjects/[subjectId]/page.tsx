import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SubjectEditContainer } from "@/modules/academic";

export const metadata: Metadata = {
  title: "Sửa môn học",
};

/**
 * Renders the screen for editing one subject.
 *
 * A path segment that is not a number never reaches the API: it cannot identify a
 * record, so it is a wrong URL rather than a missing subject.
 */
export default async function EditSubjectPage({
  params,
}: PageProps<"/academic/subjects/[subjectId]">) {
  const { subjectId } = await params;
  const id = Number(subjectId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  return <SubjectEditContainer subjectId={id} />;
}
