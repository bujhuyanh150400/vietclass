"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import {
  NAVIGATION,
  NAVIGATION_ICONS,
  isCurrentPath,
} from "@/components/layouts/navigation";
import { BrandIcon } from "@/components/shared/brand-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

/**
 * Renders the application sidebar: the brand mark, the destinations this build
 * actually ships, and the account menu handed in as a slot. Only routable
 * pages are listed — features still to come are previewed on the dashboard,
 * where each one can be described, rather than as dead rows here that look
 * like broken navigation.
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
        {NAVIGATION.map((group, index) => (
          <SidebarGroup key={group.label ?? index}>
            {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = NAVIGATION_ICONS[item.icon];

                  return (
                    <SidebarMenuItem key={item.href}>
                      {/* The current page is marked in the brand orange rather
                          than the default neutral fill, so "you are here" reads
                          at a glance on the warm sidebar sheet. */}
                      <SidebarMenuButton
                        asChild
                        isActive={isCurrentPath(item, pathname)}
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
        ))}
      </SidebarContent>

      <SidebarFooter>{accountMenu}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
