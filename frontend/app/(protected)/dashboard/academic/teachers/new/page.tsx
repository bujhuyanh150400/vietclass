import type { Metadata } from "next";

import { TeacherFormContainer } from "@/modules/academic";

export const metadata: Metadata = {
  title: "Thêm giáo viên",
};

/** Renders the screen for creating a teacher and its login account. */
export default function NewTeacherPage() {
  return <TeacherFormContainer />;
}
