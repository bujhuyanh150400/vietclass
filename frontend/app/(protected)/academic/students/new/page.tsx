import type { Metadata } from "next";

import { StudentFormContainer } from "@/modules/academic";

export const metadata: Metadata = {
  title: "Thêm học sinh",
};

/** Renders the screen for creating a student and its login account. */
export default function NewStudentPage() {
  return <StudentFormContainer />;
}
