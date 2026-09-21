import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ChevronsUpDown, Download, Image as ImageIcon, Loader2, LogOut } from "lucide-react";

import { InstallAppDialog } from "@/components/shared/pwa/install-app-dialog";
import { usePwaInstall } from "@/components/shared/pwa/pwa-provider";
import {
  getInstallGuidePlatform,
  type InstallGuidePlatform,
} from "@/components/shared/pwa/pwa-install-platform";
import { UserAvatar } from "@/modules/academic";
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

/** Keeps the browser-only platform snapshot stable because the user agent does not change during a session. */
function subscribeToInstallPlatform(): () => void {
  return () => undefined;
}

/** Resolves the install guide platform without reading browser globals during SSR. */
function getBrowserInstallPlatform(): InstallGuidePlatform | null {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  return isStandalone
    ? null
    : getInstallGuidePlatform(navigator.userAgent, navigator.maxTouchPoints);
}

/** Returns the server snapshot that prevents an install-platform hydration mismatch. */
function getServerInstallPlatform(): InstallGuidePlatform | null {
  return null;
}

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
  const { hasNativePrompt, isInstalled, requestInstall } = usePwaInstall();
  const guidePlatform = useSyncExternalStore(
    subscribeToInstallPlatform,
    getBrowserInstallPlatform,
    getServerInstallPlatform,
  );
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  /** Opens the native prompt or the platform fallback after the menu item is selected. */
  function handleInstallSelect(): void {
    if (hasNativePrompt) {
      void requestInstall();
      return;
    }

    setIsGuideOpen(true);
  }

  const canShowInstall = !isInstalled && (hasNativePrompt || guidePlatform !== null);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={user.username}
              aria-label={`Tài khoản của ${user.username}`}
              className="vc-app-account-button data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar value={user.avatar} name={user.username} alt={`Ảnh đại diện của ${user.username}`} size="sm" className="bg-sidebar-primary text-sidebar-primary-foreground" />
              <span className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">{user.username}</span>
                <span data-slot="account-role" className="truncate text-xs">
                  {getRoleLabel(user.role)}
                </span>
              </span>
              <ChevronsUpDown aria-hidden="true" className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
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
              <Link href="/academic/avatar"><ImageIcon aria-hidden="true" />Đổi ảnh đại diện</Link>
            </DropdownMenuItem>

            {canShowInstall ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleInstallSelect}>
                  <Download aria-hidden="true" />
                  Cài ứng dụng
                </DropdownMenuItem>
              </>
            ) : null}

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

        {guidePlatform !== null && !hasNativePrompt ? (
          <InstallAppDialog
            open={isGuideOpen}
            onOpenChange={setIsGuideOpen}
            platform={guidePlatform}
          />
        ) : null}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
