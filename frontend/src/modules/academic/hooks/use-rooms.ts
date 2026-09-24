"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsNumberLiteral,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

import { useResourceList, type ResourceListViewModel } from "@/hooks/use-resource-list";

import {
  changeRoomStatus,
  createRoom,
  deleteRoom,
  fetchRoom,
  fetchRoomOptions,
  fetchRooms,
  updateRoom,
} from "../api";
import { academicQueryKeys } from "./academic-query-keys";
import type { Option, Room, RoomFacility, RoomStatus } from "../types/academic";
import type { RoomListRequest, RoomRequest } from "../types/academic-requests";
import { ROOM_FACILITIES, ROOM_STATUSES } from "../utils/labels";
import {
  ROOM_LIST_SORTS,
  ROOM_LIST_VIEWS,
  ROOM_TABLE_PAGE_SIZES,
  activeRoomFilterCount,
  buildRoomListParams,
  type RoomFilterState,
  type RoomListSort,
  type RoomListView,
} from "../utils/room-list-controls";

/** List data plus the URL-backed room list controls. */
export type RoomListViewModel = ResourceListViewModel<Room> & {
  filters: RoomFilterState;
  filterCount: number;
  sort: RoomListSort;
  view: RoomListView;
  tablePageSize: number;
  setStatus: (status: RoomStatus | null) => void;
  toggleFacility: (facility: RoomFacility) => void;
  setCapacityMin: (capacity: number | null) => void;
  setCapacityMax: (capacity: number | null) => void;
  setSort: (sort: RoomListSort) => void;
  setView: (view: RoomListView) => void;
  setTablePageSize: (pageSize: number) => void;
  clearFilters: () => void;
  clearConditions: () => void;
};

/**
 * Loads the room list for the current search, page, filters, sort, and view.
 *
 * Every control lives in the URL rather than in component state, so a narrowed list
 * survives a reload and can be handed to somebody else as a link.
 */
export function useRoomList(): RoomListViewModel {
  const [controls, setControls] = useQueryStates(
    {
      status: parseAsNumberLiteral(ROOM_STATUSES),
      facilities: parseAsArrayOf(parseAsNumberLiteral(ROOM_FACILITIES)).withDefault([]),
      capacity_min: parseAsInteger,
      capacity_max: parseAsInteger,
      sort: parseAsStringLiteral(ROOM_LIST_SORTS).withDefault("newest"),
      view: parseAsStringLiteral(ROOM_LIST_VIEWS).withDefault("table"),
      per_page: parseAsNumberLiteral(ROOM_TABLE_PAGE_SIZES).withDefault(10),
    },
    { history: "replace", clearOnDefault: true },
  );
  const filters: RoomFilterState = {
    status: controls.status,
    facilities: controls.facilities,
    capacityMin: controls.capacity_min,
    capacityMax: controls.capacity_max,
  };
  const list = useResourceList<Room, RoomListRequest>({
    queryKey: academicQueryKeys.rooms.list,
    fetcher: fetchRooms,
    emptyMessage: "Chưa có phòng học nào khớp với tìm kiếm.",
    extraParams: buildRoomListParams({ ...filters, sort: controls.sort }),
    perPage: controls.per_page,
  });

  /** Narrows to one availability state and returns the reader to the first page. */
  const setStatus = useCallback(
    (status: RoomStatus | null) => {
      void setControls({ status });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );
  /** Adds or removes one facility from the set a room must carry all of. */
  const toggleFacility = useCallback(
    (facility: RoomFacility) => {
      void setControls((current) => {
        const next = current.facilities.includes(facility)
          ? current.facilities.filter((value) => value !== facility)
          : [...current.facilities, facility].sort((a, b) => a - b);

        return { facilities: next.length === 0 ? null : next };
      });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );
  const setCapacityMin = useCallback(
    (capacity: number | null) => {
      void setControls({ capacity_min: capacity });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );
  const setCapacityMax = useCallback(
    (capacity: number | null) => {
      void setControls({ capacity_max: capacity });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );
  const setSort = useCallback(
    (sort: RoomListSort) => {
      void setControls({ sort: sort === "newest" ? null : sort });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );
  /** Switches between table and cards; the reader keeps their place in the list. */
  const setView = useCallback(
    (view: RoomListView) => {
      void setControls({ view: view === "table" ? null : view });
    },
    [setControls],
  );
  const setTablePageSize = useCallback(
    (pageSize: number) => {
      if (!ROOM_TABLE_PAGE_SIZES.includes(pageSize as (typeof ROOM_TABLE_PAGE_SIZES)[number])) return;
      void setControls({
        per_page: pageSize === 10 ? null : (pageSize as (typeof ROOM_TABLE_PAGE_SIZES)[number]),
      });
      list.query.setPage(1);
    },
    [list.query, setControls],
  );
  const clearFilters = useCallback(() => {
    void setControls({ status: null, facilities: null, capacity_min: null, capacity_max: null });
    list.query.setPage(1);
  }, [list.query, setControls]);
  /** Clears the keyword alongside every filter and the sort, leaving the view alone. */
  const clearConditions = useCallback(() => {
    list.query.reset();
    void setControls({
      status: null,
      facilities: null,
      capacity_min: null,
      capacity_max: null,
      sort: null,
    });
  }, [list.query, setControls]);

  return {
    ...list,
    filters,
    filterCount: activeRoomFilterCount(filters),
    sort: controls.sort,
    view: controls.view,
    tablePageSize: controls.per_page,
    setStatus,
    toggleFacility,
    setCapacityMin,
    setCapacityMax,
    setSort,
    setView,
    setTablePageSize,
    clearFilters,
    clearConditions,
  };
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
    mutationFn: (body: RoomRequest) => createRoom(body),
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
    mutationFn: (body: RoomRequest) => updateRoom(id, body),
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
