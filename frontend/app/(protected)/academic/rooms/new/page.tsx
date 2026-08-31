import type { Metadata } from "next";

import { RoomFormContainer } from "@/modules/academic";

export const metadata: Metadata = {
  title: "Thêm phòng học",
};

/** Renders the screen for creating a room. */
export default function NewRoomPage() {
  return <RoomFormContainer />;
}
