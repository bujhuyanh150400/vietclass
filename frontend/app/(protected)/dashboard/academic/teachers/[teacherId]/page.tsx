import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TeacherEditContainer } from "@/modules/academic";

export const metadata: Metadata = {
  title: "Sửa hồ sơ giáo viên",
};

/**
 * Renders the screen for editing one teacher profile.
 *
 * A path segment that is not a number never reaches the API: it cannot identify a
 * record, so it is a wrong URL rather than a missing teacher.
 */
export default async function EditTeacherPage({
  params,
}: PageProps<"/dashboard/academic/teachers/[teacherId]">) {
  const { teacherId } = await params;
  const id = Number(teacherId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  return <TeacherEditContainer teacherId={id} />;
}
