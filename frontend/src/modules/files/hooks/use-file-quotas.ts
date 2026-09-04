"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchFileQuotas, updateFileQuotas } from "../api";
import { fileQueryKeys, fileQuotaQueryKeys } from "./file-query-keys";
import type { UpdateFileQuotasRequest } from "../types/file-requests";

/** Fetches System's role quota map. */
export function useFileQuotas(enabled = true) {
  return useQuery({
    queryKey: fileQuotaQueryKeys.root(),
    queryFn: fetchFileQuotas,
    enabled,
  });
}

/** Replaces System's role quota map and refreshes quota-dependent usage after success. */
export function useUpdateFileQuotas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateFileQuotasRequest) => updateFileQuotas(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileQuotaQueryKeys.root() });
      void queryClient.invalidateQueries({ queryKey: fileQueryKeys.usageRoot() });
    },
  });
}
