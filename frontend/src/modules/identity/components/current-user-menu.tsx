"use client";

import { Loader2, LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useLogout } from "../hooks/use-logout";
import type { CurrentUser } from "../types/auth";
import { getRoleLabel } from "../utils/get-role-label";

/** Shown when the browser cannot complete the same-origin logout request. */
const LOGOUT_RETRY_MESSAGE = "Không đăng xuất được. Vui lòng thử lại.";

/**
 * Derives the avatar's single-letter fallback from the first visible character of
 * a username, so an unusual or whitespace-padded name still produces a stable
 * initial instead of an empty circle.
 */
function getAvatarInitial(username: string): string {
  const [initial] = Array.from(username.trim());

  return (initial ?? "?").toUpperCase();
}

/**
 * Renders the account menu in the topbar. It shows only the authenticated
 * username and role label — never token or expiry data — and offers the single
 * logout action, which cannot be submitted twice at once.
 */
export function CurrentUserMenu({ user }: { user: CurrentUser }) {
  const logout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Tài khoản của ${user.username}`}
          className="rounded-full"
        >
          <Avatar className="size-8">
            <AvatarFallback>{getAvatarInitial(user.username)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="grid gap-0.5">
          <span className="truncate text-sm font-medium">{user.username}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {getRoleLabel(user.role)}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={logout.isPending}
          onSelect={(event) => {
            // Keep the menu open so a failed attempt can be retried in place.
            event.preventDefault();
            logout.mutate();
          }}
        >
          {logout.isPending ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <LogOut aria-hidden="true" />
          )}
          Đăng xuất
        </DropdownMenuItem>

        {logout.isError ? (
          <p role="alert" className="px-2 py-1.5 text-xs text-destructive">
            {LOGOUT_RETRY_MESSAGE}
          </p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
