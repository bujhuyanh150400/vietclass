"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, type ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { isApiClientError } from "@/lib/api/api-client-error";

import { useCurrentUser } from "../hooks/use-current-user";
import { sanitizeReturnTo } from "../utils/sanitize-return-to";

/**
 * Decides whether a visitor who still carries a session cookie should see the
 * login form. A recoverable session sends them straight on to their destination,
 * a rejected one falls through to the form (the session route clears the stale
 * cookie), and a service outage offers a retry instead of a credentials error.
 */
export function ExistingSessionGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [returnTo] = useQueryState("returnTo");
  const session = useCurrentUser(true);

  useEffect(() => {
    if (session.data === undefined) {
      return;
    }

    router.replace(sanitizeReturnTo(returnTo));
  }, [session.data, returnTo, router]);

  if (session.isPending || session.data !== undefined) {
    return (
      <div
        aria-live="polite"
        role="status"
        className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
      >
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (isApiClientError(session.error) && session.error.isServiceFailure) {
    return (
      <div className="grid gap-4">
        <Alert variant="destructive">
          <AlertTitle>Không kiểm tra được phiên đăng nhập</AlertTitle>
          <AlertDescription>{session.error.message}</AlertDescription>
        </Alert>
        <Button
          type="button"
          variant="outline"
          onClick={() => void session.refetch()}
          disabled={session.isFetching}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
