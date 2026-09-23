import type { Metadata } from "next";

import { GuardianEditLoader } from "@/modules/academic";

export const metadata: Metadata = { title: "Sửa phụ huynh" };

/** Renders the guardian edit screen after loading its current record. */
export default async function EditGuardianPage({ params }: { params: Promise<{ guardianId: string }> }) {
  const { guardianId } = await params;
  return <GuardianEditLoader id={Number(guardianId)} />;
}
