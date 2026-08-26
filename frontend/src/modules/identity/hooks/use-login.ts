import { useMutation, useQueryClient } from "@tanstack/react-query";

import { login } from "../api/identity-client-api";
import type { CurrentUser, LoginCredentials } from "../types/auth";
import { identityQueryKeys } from "./identity-query-keys";

/**
 * Provides the login mutation for the sign-in form. Credentials live only in the
 * mutation call, and only the returned user is written to the cache, so no
 * password or token is ever cached, keyed, or persisted.
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<CurrentUser, Error, LoginCredentials>({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(identityQueryKeys.currentUser(), user);
    },
  });
}
