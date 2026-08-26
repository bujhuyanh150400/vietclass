import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Suspense, type ReactNode } from "react";

import { ProtectedShell } from "@/components/layouts/protected-shell";
import type { NavigationItem } from "@/components/layouts/app-sidebar";
import { AppShellSkeleton } from "@/components/shared/app-shell-skeleton";
import { AuthServiceUnavailable } from "@/components/shared/auth-service-unavailable";
import { isApiClientError } from "@/lib/api/api-client-error";
import {
  CurrentUserMenuContainer,
  type CurrentUser,
} from "@/modules/identity";
import { SESSION_COOKIE_NAME, fetchCurrentUser } from "@/modules/identity/server";

/** The only destination the protected area currently offers. */
const NAVIGATION: NavigationItem[] = [
  { href: "/dashboard", label: "Tổng quan", icon: "dashboard", current: true },
];

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
async function AuthenticatedShell({ children }: { children: ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

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

  return (
    <ProtectedShell
      navigation={NAVIGATION}
      accountMenu={<CurrentUserMenuContainer user={outcome.user} />}
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
    <Suspense fallback={<AppShellSkeleton />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
