import type { Metadata } from "next";

import { SubjectFormContainer } from "@/modules/academic";

export const metadata: Metadata = {
  title: "Thêm môn học",
};

/** Renders the screen for creating a subject. */
export default function NewSubjectPage() {
  return <SubjectFormContainer />;
}
