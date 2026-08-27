import type { Metadata } from "next";

import { ClassFormContainer } from "@/modules/academic";

export const metadata: Metadata = {
  title: "Thêm lớp học",
};

/** Renders the screen for creating a class. */
export default function NewClassPage() {
  return <ClassFormContainer />;
}
