import { browserRequest, browserRequestList } from "@/lib/api/browser-request";
import type { Page } from "@/lib/api/contracts";

import type { Option, Room, RoomFacility, RoomStatus } from "../types/academic";
import type { RoomRequest } from "../types/academic-requests";

/** Query parameters accepted by the room list endpoint. */
export type RoomListParams = {
  q?: string;
  page?: number;
  per_page?: number;
  sort?: "id" | "name" | "capacity" | "created_at";
  direction?: "asc" | "desc";
  status?: RoomStatus;
  // Repeated as `facilities[]=0&facilities[]=9`, which is what axios's default
  // serializer emits for an array and what Laravel reads back as a list. The API
  // narrows to rooms carrying every value given, not any of them.
  facilities?: RoomFacility[];
  capacity_min?: number;
  capacity_max?: number;
};

/** Query parameters accepted by the room option endpoint. */
export type RoomOptionParams = {
  q?: string;
  limit?: number;
};

/** Fetches one page of rooms. */
export async function fetchRooms(params: RoomListParams): Promise<Page<Room>> {
  return browserRequestList<Room>("/api/v1/academic/rooms", { params });
}

/** Fetches the rooms a schedule may be assigned to. */
export async function fetchRoomOptions(params: RoomOptionParams): Promise<Option[]> {
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
