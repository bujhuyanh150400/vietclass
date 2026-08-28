import type { Metadata } from "next";

import { TeachersContainer } from "@/modules/academic";

export const metadata: Metadata = {
  title: "Giáo viên",
};

/** Renders the teacher management screen. */
export default function TeachersPage() {
  return <TeachersContainer />;
}
