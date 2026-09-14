"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchGuardianOptions } from "../api/guardians-api";
import type { GuardianOption } from "../types/academic";
import { academicQueryKeys } from "./academic-query-keys";

/**
 * Loads the guardians already on file that match a typed name or phone number.
 *
 * The caller passes an already-debounced term, so one query is cached per term the
 * reader actually settled on rather than per keystroke.
 */
export function useGuardianOptions(search = "") {
  return useQuery<GuardianOption[]>({
    queryKey: academicQueryKeys.guardians.options(search),
    queryFn: () => fetchGuardianOptions({ q: search, limit: 20 }),
    // Keeps the previous matches on screen while the next term is in flight, so the
    // picker narrows rather than blanking to a loading line on every keystroke.
    placeholderData: (previous) => previous,
  });
}
