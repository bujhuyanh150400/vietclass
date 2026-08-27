"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { type ReactNode } from "react";

import { BrandIcon } from "@/components/shared/brand-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

/** Icons a navigation item may request, kept closed so no arbitrary icon leaks in. */
const NAVIGATION_ICONS = {
  dashboard: LayoutDashboard,
} as const;

/** One entry in the application navigation. */
export type NavigationItem = {
  href: string;
  label: string;
  icon: keyof typeof NAVIGATION_ICONS;
  current: boolean;
};

/**
 * Renders the application sidebar: the brand mark, the destinations this build
 * actually ships, and the account menu handed in as a slot. Only routable
 * pages are listed — the classroom features still to come are previewed on the
 * dashboard, where each one can be described, rather than as dead rows here
 * that look like broken navigation.
 *
 * Both the fixed desktop rail and the mobile drawer come from the shared
 * `Sidebar` primitive, so this component only supplies content.
 */
export function AppSidebar({
  navigation,
  accountMenu,
}: {
  navigation: NavigationItem[];
  accountMenu: ReactNode;
}) {
  const { setOpenMobile } = useSidebar();

  /** Closes the mobile drawer after navigating so the destination is visible. */
  function closeOnMobile() {
    setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/dashboard" onClick={closeOnMobile}>
                <BrandIcon className="size-6" />
                <span className="font-pixel text-xs tracking-[0.08em]">
                  VIETCLASSES
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = NAVIGATION_ICONS[item.icon];

                return (
                  <SidebarMenuItem key={item.href}>
                    {/* The current page is marked in the brand orange rather
                        than the default neutral fill, so "you are here" reads
                        at a glance on the warm sidebar sheet. */}
                    <SidebarMenuButton
                      asChild
                      isActive={item.current}
                      tooltip={item.label}
                      className="data-[active=true]:bg-vc-orange/15 data-[active=true]:text-vc-wood data-[active=true]:[&>svg]:text-vc-orange-deep"
                    >
                      <Link href={item.href} onClick={closeOnMobile}>
                        <Icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>{accountMenu}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
