import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClassDetailContainer } from "@/modules/academic";

export const metadata: Metadata = {
  title: "Chi tiết lớp học",
};

/**
 * Renders one class with its roster.
 *
 * A path segment that is not a number never reaches the API: it cannot identify a
 * record, so it is a wrong URL rather than a missing class.
 */
export default async function ClassDetailPage({
  params,
}: PageProps<"/academic/classes/[classId]">) {
  const { classId } = await params;
  const id = Number(classId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  return <ClassDetailContainer classId={id} />;
}
