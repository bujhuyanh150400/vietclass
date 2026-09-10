"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { type ReactNode } from "react";

import {
  NAVIGATION,
  NAVIGATION_ICONS,
  isCurrentPath,
} from "@/components/layouts/navigation";
import { BrandMark } from "@/components/shared/brand-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

/** The strapline under the wordmark; the sidebar is the only place it appears. */
const BRAND_CAPTION = "Không gian quản lý lớp học";

/**
 * Renders the application sidebar: the brand mark, the current navigation
 * groups, and the account menu handed in as a slot. Upcoming features remain
 * visible as non-routable placeholders so the information architecture is
 * discoverable without implying that a screen or API exists.
 *
 * Which item is current is derived from the live path rather than passed in, so
 * the highlight follows client-side navigation without the server re-rendering.
 *
 * Both the fixed desktop rail and the mobile drawer come from the shared
 * `Sidebar` primitive, so this component only supplies content.
 */
export function AppSidebar({ accountMenu }: { accountMenu: ReactNode }) {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();

  /** Closes the mobile drawer after navigating so the destination is visible. */
  function closeOnMobile() {
    setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="vc-app-sidebar">
      <SidebarHeader className="vc-app-sidebar-header">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="vc-app-brand-button">
              <Link
                href="/dashboard"
                aria-label="VietClasses · Trang chủ"
                onClick={closeOnMobile}
              >
                <BrandMark
                  tone="paper"
                  caption={BRAND_CAPTION}
                  className="vc-app-brand-lockup"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAVIGATION.map((group, index) => (
          <SidebarGroup key={group.label ?? index}>
            {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = NAVIGATION_ICONS[item.icon];

                  if (item.kind === "upcoming") {
                    return (
                      <SidebarMenuItem key={`${item.kind}-${item.label}`}>
                        <SidebarMenuButton
                          aria-disabled="true"
                          aria-label={`${item.label} · ${item.badge}`}
                          tooltip={`${item.label} · ${item.badge}`}
                          className="vc-app-upcoming-item aria-disabled:pointer-events-auto"
                        >
                          <Icon aria-hidden="true" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      </SidebarMenuItem>
                    );
                  }

                  const isActive = isCurrentPath(item, pathname);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className="vc-app-nav-item"
                      >
                        <Link href={item.href} onClick={closeOnMobile}>
                          <Icon aria-hidden="true" />
                          <span>{item.label}</span>
                          {isActive ? (
                            <ChevronRight
                              aria-hidden="true"
                              className="vc-app-nav-marker"
                            />
                          ) : null}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>{accountMenu}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
