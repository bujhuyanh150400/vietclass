import type { Metadata } from "next";

import { GuardianDetailContainer } from "@/modules/academic";

export const metadata: Metadata = { title: "Chi tiết phụ huynh" };

/** Renders one guardian detail screen. */
export default async function GuardianPage({ params }: { params: Promise<{ guardianId: string }> }) {
  const { guardianId } = await params;
  return <GuardianDetailContainer id={Number(guardianId)} />;
}
