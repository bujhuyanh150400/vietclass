import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { logout } from "../api/identity-client-api";
import { identityQueryKeys } from "./identity-query-keys";

/**
 * Provides the logout mutation for the account menu. Once local logout succeeds
 * the cached identity is dropped, history is replaced with `/login` so the
 * protected page cannot be reached with Back, and Server Components re-render
 * against the now-absent session.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<void, Error, void>({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: identityQueryKeys.currentUser() });
      router.replace("/login");
      router.refresh();
    },
  });
}
