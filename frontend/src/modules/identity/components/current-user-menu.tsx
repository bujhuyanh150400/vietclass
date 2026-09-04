import Link from "next/link";
import { ChevronsUpDown, Image as ImageIcon, Loader2, LogOut } from "lucide-react";

import { UserAvatar } from "@/modules/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import type { CurrentUser } from "../types/auth";
import { getRoleLabel } from "../utils/get-role-label";

/** Shown when the browser cannot complete the same-origin logout request. */
const LOGOUT_RETRY_MESSAGE = "Không đăng xuất được. Vui lòng thử lại.";

/**
 * Renders the account menu from user data and callback state supplied by its
 * container; logout mutation and navigation stay outside this component. It
 * renders as a sidebar row — collapsing to just the avatar when the rail is
 * icon-only — so it always lives inside the protected shell's `SidebarFooter`.
 */
export function CurrentUserMenu({
  user,
  isLoggingOut,
  hasLogoutError,
  onLogout,
}: {
  user: CurrentUser;
  isLoggingOut: boolean;
  hasLogoutError: boolean;
  onLogout: () => void;
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={user.username}
              aria-label={`Tài khoản của ${user.username}`}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar value={user.avatar} name={user.username} alt={`Ảnh đại diện của ${user.username}`} size="sm" className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground" />
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">{user.username}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {getRoleLabel(user.role)}
                </span>
              </span>
              <ChevronsUpDown aria-hidden="true" className="ml-auto size-4 text-sidebar-foreground/50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
          >
            <DropdownMenuLabel className="grid gap-0.5">
              <span className="truncate text-sm font-medium">{user.username}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {getRoleLabel(user.role)}
              </span>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/account/avatar"><ImageIcon aria-hidden="true" />Đổi ảnh đại diện</Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              disabled={isLoggingOut}
              onSelect={(event) => {
                // Keep the menu open so a failed attempt can be retried in place.
                event.preventDefault();
                onLogout();
              }}
            >
              {isLoggingOut ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <LogOut aria-hidden="true" />
              )}
              Đăng xuất
            </DropdownMenuItem>

            {hasLogoutError ? (
              <p role="alert" className="px-2 py-1.5 text-xs text-destructive">
                {LOGOUT_RETRY_MESSAGE}
              </p>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
