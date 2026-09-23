import type { Metadata } from "next";

import { GuardianFormContainer } from "@/modules/academic";

export const metadata: Metadata = { title: "Thêm phụ huynh" };

/** Renders the guardian creation form. */
export default function NewGuardianPage() {
  return <GuardianFormContainer />;
}
