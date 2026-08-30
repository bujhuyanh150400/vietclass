import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Suspense, type ReactNode } from "react";

import { ProtectedShell } from "@/components/layouts/protected-shell";
import { AppShellSkeleton } from "@/components/shared/app-shell-skeleton";
import { AuthServiceUnavailable } from "@/components/shared/auth-service-unavailable";
import { RouteLoadingState } from "@/components/shared/route-loading-state";
import { isApiClientError } from "@/lib/api/api-client-error";
import {
  CurrentUserMenuContainer,
  type CurrentUser,
} from "@/modules/identity";
import { SESSION_COOKIE_NAME, fetchCurrentUser } from "@/modules/identity/server";

/** Either a verified identity or a transient failure to reach the auth service. */
type SessionOutcome =
  | { kind: "authenticated"; user: CurrentUser }
  | { kind: "service-failure"; message: string };

/**
 * Builds a `/login` URL that sends the visitor back here once they sign in, with
 * an optional reason so an expired session can be explained rather than looking
 * like a rejected password.
 */
function loginUrl(reason?: "expired"): string {
  const params = new URLSearchParams();

  if (reason !== undefined) {
    params.set("reason", reason);
  }

  params.set("returnTo", "/dashboard");

  return `/login?${params.toString()}`;
}

/**
 * Verifies a session token against Laravel. A rejected token redirects to the
 * sign-in page with the expired reason, while an unreachable service is reported
 * back as a retryable failure so an outage is never shown as a bad password.
 */
async function resolveSession(token: string): Promise<SessionOutcome> {
  try {
    return { kind: "authenticated", user: await fetchCurrentUser(token) };
  } catch (error) {
    if (isApiClientError(error)) {
      if (error.status === 401) {
        redirect(loginUrl("expired"));
      }

      if (error.isServiceFailure) {
        return { kind: "service-failure", message: error.message };
      }
    }

    throw error;
  }
}

/**
 * Renders the authenticated shell around the active protected route, redirecting
 * to `/login` when no session cookie was sent at all.
 */
/** The sidebar persists its open/collapsed state here between visits. */
const SIDEBAR_STATE_COOKIE = "sidebar_state";

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token === undefined || token === "") {
    redirect(loginUrl());
  }

  const outcome = await resolveSession(token);

  if (outcome.kind === "service-failure") {
    return (
      <AuthServiceUnavailable
        message={outcome.message}
        retryHref="/dashboard"
      />
    );
  }

  const defaultSidebarOpen =
    cookieStore.get(SIDEBAR_STATE_COOKIE)?.value !== "false";

  return (
    <ProtectedShell
      accountMenu={<CurrentUserMenuContainer user={outcome.user} />}
      defaultSidebarOpen={defaultSidebarOpen}
    >
      {children}
    </ProtectedShell>
  );
}

/**
 * Wraps every protected route in the app-shell skeleton while the authenticated
 * shell resolves, keeping this layout itself synchronous so the skeleton can be
 * streamed before the session check finishes.
 */
export default function ProtectedLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={null}>
        <RouteLoadingState />
      </Suspense>
      <Suspense fallback={<AppShellSkeleton />}>
        <AuthenticatedShell>{children}</AuthenticatedShell>
      </Suspense>
    </>
  );
}
