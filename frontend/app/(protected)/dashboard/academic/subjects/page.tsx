import type { Metadata } from "next";

import { SubjectsContainer } from "@/modules/academic";

export const metadata: Metadata = {
  title: "Môn học",
};

/** Renders the subject management screen. */
export default function SubjectsPage() {
  return <SubjectsContainer />;
}
