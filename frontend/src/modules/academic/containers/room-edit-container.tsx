"use client";

import { ResourceLoader } from "@/components/shared/resource-loader";

import { useRoom } from "../hooks/use-rooms";
import { RoomFormContainer } from "./room-form-container";

/**
 * Loads the room being edited, then hands it to the form after its values arrive.
 */
export function RoomEditContainer({ roomId }: { roomId: number }) {
  const query = useRoom(roomId);

  return (
    <ResourceLoader query={query} notFoundMessage="Không tìm thấy phòng học.">
      {(room) => <RoomFormContainer room={room} />}
    </ResourceLoader>
  );
}
