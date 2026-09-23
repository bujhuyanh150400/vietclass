import type { Metadata } from "next";

import { GuardiansContainer } from "@/modules/academic";

export const metadata: Metadata = { title: "Phụ huynh" };

/** Renders the guardian directory. */
export default function GuardiansPage() {
  return <GuardiansContainer />;
}
