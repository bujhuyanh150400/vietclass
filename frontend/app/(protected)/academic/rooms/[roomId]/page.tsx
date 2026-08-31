import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RoomEditContainer } from "@/modules/academic";

export const metadata: Metadata = {
  title: "Sửa phòng học",
};

/**
 * Renders the screen for editing one room after rejecting non-numeric path segments.
 */
export default async function EditRoomPage({
  params,
}: PageProps<"/academic/rooms/[roomId]">) {
  const { roomId } = await params;
  const id = Number(roomId);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  return <RoomEditContainer roomId={id} />;
}
