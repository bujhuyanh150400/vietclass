"use client";

import { CurrentUserMenu } from "../components/current-user-menu";
import { useLogout } from "../hooks/use-logout";
import type { CurrentUser } from "../types/auth";

/** Connects the logout mutation state and action to the account-menu view. */
export function CurrentUserMenuContainer({ user }: { user: CurrentUser }) {
  const logout = useLogout();

  /** Starts one logout attempt while the view prevents duplicate selection. */
  function handleLogout() {
    logout.mutate();
  }

  return (
    <CurrentUserMenu
      user={user}
      isLoggingOut={logout.isPending}
      hasLogoutError={logout.isError}
      onLogout={handleLogout}
    />
  );
}
