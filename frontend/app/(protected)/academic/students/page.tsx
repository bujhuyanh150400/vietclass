import type { Metadata } from "next";

import { StudentsContainer } from "@/modules/academic";

export const metadata: Metadata = {
  title: "Học sinh",
};

/** Renders the student management screen. */
export default function StudentsPage() {
  return <StudentsContainer />;
}
