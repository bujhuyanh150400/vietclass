"use client";

import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect } from "react";

import { isApiClientError } from "@/lib/api/api-client-error";

import { sanitizeReturnTo } from "../utils/sanitize-return-to";
import { useCurrentUser } from "./use-current-user";

/** View states the session recovery component can render. */
export type ExistingSessionViewModel =
  | { kind: "checking" }
  | {
      kind: "service-failure";
      message: string;
      isRetrying: boolean;
      onRetry: () => void;
    }
  | { kind: "content" };

/**
 * Resolves an existing browser session when enabled, redirects valid sessions,
 * and exposes a retryable service failure without putting that behavior in the view.
 */
export function useExistingSession(enabled: boolean): ExistingSessionViewModel {
  const router = useRouter();
  const [returnTo] = useQueryState("returnTo");
  const session = useCurrentUser(enabled);

  useEffect(() => {
    if (!enabled || session.data === undefined) {
      return;
    }

    router.replace(sanitizeReturnTo(returnTo));
  }, [enabled, session.data, returnTo, router]);

  /** Retries the session endpoint after a transient service failure. */
  function retrySession() {
    void session.refetch();
  }

  if (!enabled) {
    return { kind: "content" };
  }

  if (session.isPending || session.data !== undefined) {
    return { kind: "checking" };
  }

  if (isApiClientError(session.error) && session.error.isServiceFailure) {
    return {
      kind: "service-failure",
      message: session.error.message,
      isRetrying: session.isFetching,
      onRetry: retrySession,
    };
  }

  return { kind: "content" };
}
