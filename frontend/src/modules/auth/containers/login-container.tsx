"use client";

import { ExistingSessionView } from "../components/existing-session-view";
import { LoginForm } from "../components/login-form";
import { LoginView } from "../components/login-view";
import { useExistingSession } from "../hooks/use-existing-session";
import { useLoginForm } from "../hooks/use-login-form";

/**
 * Coordinates the login form and optional session recovery as one page-level
 * flow, avoiding wrapper containers around each individual presentational view.
 */
export function LoginContainer({
  hasSessionCookie,
}: {
  hasSessionCookie: boolean;
}) {
  const loginForm = useLoginForm();
  const existingSession = useExistingSession(hasSessionCookie);

  return (
    <LoginView>
      <ExistingSessionView viewModel={existingSession}>
        <LoginForm {...loginForm} />
      </ExistingSessionView>
    </LoginView>
  );
}
