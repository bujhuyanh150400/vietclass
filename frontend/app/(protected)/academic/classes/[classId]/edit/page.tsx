import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClassEditContainer } from "@/modules/academic";

export const metadata: Metadata = {
  title: "Sửa lớp học",
};

/**
 * Renders the screen for editing one class.
 *
 * A path segment that is not a number never reaches the API: it cannot identify a
 * record, so it is a wrong URL rather than a missing class.
 */
export default async function EditClassPage({
  params,
}: PageProps<"/academic/classes/[classId]/edit">) {
  const { classId } = await params;
  const id = Number(classId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  return <ClassEditContainer classId={id} />;
}
