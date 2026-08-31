import type { Metadata } from "next";

import { RoomsContainer } from "@/modules/academic";

export const metadata: Metadata = {
  title: "Phòng học",
};

/** Renders the room management screen. */
export default function RoomsPage() {
  return <RoomsContainer />;
}
