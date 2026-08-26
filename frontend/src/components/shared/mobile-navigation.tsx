"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { AppSidebar, type NavigationItem } from "@/components/layouts/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Renders the navigation drawer used below the desktop breakpoint. Its open
 * state is the only client state in the shell, and following a link closes the
 * drawer so the destination is not hidden behind it.
 */
export function MobileNavigation({
  navigation,
}: {
  navigation: NavigationItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Mở điều hướng"
          className="lg:hidden"
        >
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Điều hướng chính</SheetTitle>
        <AppSidebar
          navigation={navigation}
          onNavigate={() => setIsOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
