import { useQuery } from "@tanstack/react-query";

import { getCurrentUser } from "../api/identity-client-api";
import { identityQueryKeys } from "./identity-query-keys";

/**
 * Reads the authenticated user from the session route. The request is opt-in so
 * a page only pays for session recovery when the server already observed a
 * session cookie, and a rejected session is not retried as if it were an outage.
 */
export function useCurrentUser(enabled: boolean) {
  return useQuery({
    queryKey: identityQueryKeys.currentUser(),
    queryFn: getCurrentUser,
    enabled,
    retry: false,
  });
}
