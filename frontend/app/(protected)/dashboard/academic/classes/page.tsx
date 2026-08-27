import type { Metadata } from "next";

import { ClassesContainer } from "@/modules/academic";

export const metadata: Metadata = {
  title: "Lớp học",
};

/** Renders the class management screen. */
export default function ClassesPage() {
  return <ClassesContainer />;
}
