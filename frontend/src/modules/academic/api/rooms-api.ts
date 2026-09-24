import { browserRequest, browserRequestList } from "@/lib/api/browser-request";
import type { Page } from "@/lib/api/contracts";

import type { Option, Room, RoomStatus } from "../types/academic";
import type {
  RoomListRequest,
  RoomOptionRequest,
  RoomRequest,
} from "../types/academic-requests";

/** Fetches one page of rooms. */
export async function fetchRooms(params: RoomListRequest): Promise<Page<Room>> {
  return browserRequestList<Room>("/api/v1/academic/rooms", { params });
}

/** Fetches the rooms a schedule may be assigned to. */
export async function fetchRoomOptions(params: RoomOptionRequest): Promise<Option[]> {
  return browserRequest<Option[]>("/api/v1/academic/rooms/options", { params });
}

/** Fetches one room. */
export async function fetchRoom(id: number): Promise<Room> {
  return browserRequest<Room>(`/api/v1/academic/rooms/${id}`);
}

/** Creates a room. */
export async function createRoom(body: RoomRequest): Promise<Room> {
  return browserRequest<Room>("/api/v1/academic/rooms", { method: "POST", body });
}

/** Changes a room's editable details. */
export async function updateRoom(id: number, body: RoomRequest): Promise<Room> {
  return browserRequest<Room>(`/api/v1/academic/rooms/${id}`, { method: "PUT", body });
}

/** Changes a room's availability status. */
export async function changeRoomStatus(id: number, status: RoomStatus): Promise<Room> {
  return browserRequest<Room>(`/api/v1/academic/rooms/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

/** Removes a room with no schedule references. */
export async function deleteRoom(id: number): Promise<void> {
  await browserRequest<undefined>(`/api/v1/academic/rooms/${id}`, { method: "DELETE" });
}
