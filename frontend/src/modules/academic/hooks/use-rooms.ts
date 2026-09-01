"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  changeRoomStatus,
  createRoom,
  deleteRoom,
  fetchRoom,
  fetchRoomOptions,
  fetchRooms,
  updateRoom,
} from "../api/academic-client-api";
import { academicQueryKeys } from "./academic-query-keys";
import { useResourceList, type ResourceListViewModel } from "./use-resource-list";
import type { Option, Room, RoomStatus } from "../types/academic";

/**
 * Loads the room list for the current search, page, and optional availability filter.
 */
export function useRoomList(status?: RoomStatus): ResourceListViewModel<Room> {
  return useResourceList<Room>({
    queryKey: academicQueryKeys.rooms.list,
    fetcher: fetchRooms,
    emptyMessage: "Chưa có phòng học nào khớp với tìm kiếm.",
    extraParams: status === undefined ? undefined : { status },
  });
}

/**
 * Loads one room, used by the edit screen to fill its form.
 */
export function useRoom(id: number) {
  return useQuery({
    queryKey: academicQueryKeys.rooms.detail(id),
    queryFn: () => fetchRoom(id),
  });
}

/**
 * Loads the active rooms a future schedule picker may choose from.
 */
export function useRoomOptions(search = "") {
  return useQuery<Option[]>({
    queryKey: academicQueryKeys.rooms.options(search),
    queryFn: () => fetchRoomOptions({ q: search, limit: 50 }),
  });
}

/**
 * Creates a room and refreshes every cached room list.
 */
export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: unknown) => createRoom(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.rooms.root() });
    },
  });
}

/**
 * Changes a room and refreshes every cached room list.
 */
export function useUpdateRoom(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: unknown) => updateRoom(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.rooms.root() });
    },
  });
}

/**
 * Changes a room's availability and refreshes lists and active-room options.
 */
export function useChangeRoomStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: RoomStatus }) =>
      changeRoomStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.rooms.root() });
    },
  });
}

/**
 * Removes a room and refreshes every cached room list.
 */
export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteRoom(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: academicQueryKeys.rooms.root() });
    },
  });
}
