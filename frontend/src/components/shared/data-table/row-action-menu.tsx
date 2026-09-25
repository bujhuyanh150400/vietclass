"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";

import { AppButton } from "@/components/shared/app-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * One entry in a row's action menu, or the literal `"separator"` to divide two
 * groups of entries.
 *
 * An entry is either a navigation (`href`) or a command (`onSelect`), matching
 * the two things a row action ever does — never both, since a menu item that
 * navigated and ran a mutation would leave one of the two silently ignored.
 */
export type RowAction =
  | {
      key: string;
      label: string;
      icon?: ReactNode;
      variant?: "default" | "destructive";
      onSelect: () => void;
      href?: never;
    }
  | {
      key: string;
      label: string;
      icon?: ReactNode;
      variant?: "default" | "destructive";
      href: string;
      onSelect?: never;
    }
  | "separator";

/**
 * Row geometry the mock's own `.dropdown` rule specifies (`assets/app.css`):
 * `min-height:44px; padding:10px; gap:10px; font-size:12px` on every item, a
 * 220px panel with `border-radius:7px` and `padding:6px`. shadcn's default
 * `DropdownMenuItem` is a compact 32px row sized for text-only menus; overriding
 * it here — rather than in the primitive itself — keeps Students' and Subjects'
 * existing icon-less menus at their current size while giving every future
 * icon-leading menu this component's geometry from the start.
 */
const ITEM_CLASS = "min-h-11 gap-2.5 rounded-control px-2.5 py-2.5 text-xs";

/**
 * Renders the per-row "⋯" action menu shared by every list screen's table and
 * card layouts: a ghost icon-only trigger opening a menu of icon-leading items.
 *
 * One shared primitive keeps the trigger's sizing and the item's icon, label,
 * and destructive treatment identical across screens, rather than each list
 * re-declaring its own `DropdownMenu` around a `MoreHorizontal` button.
 */
export function RowActionMenu({
  actions,
  triggerLabel,
  triggerClassName,
}: {
  actions: RowAction[];
  triggerLabel: string;
  triggerClassName?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AppButton
          variant="secondary"
          size="icon-sm"
          aria-label={triggerLabel}
          className={triggerClassName}
        >
          <MoreHorizontal aria-hidden="true" />
        </AppButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px] rounded-panel p-1.5 shadow-lg">
        {actions.map((action, index) =>
          action === "separator" ? (
            // Index is stable here: `actions` is a literal built fresh per render,
            // never reordered or filtered after the fact.
            <DropdownMenuSeparator key={`separator-${index}`} />
          ) : action.href !== undefined ? (
            <DropdownMenuItem
              key={action.key}
              variant={action.variant}
              className={ITEM_CLASS}
              asChild
            >
              <Link href={action.href}>
                {action.icon}
                {action.label}
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              key={action.key}
              variant={action.variant}
              className={ITEM_CLASS}
              onSelect={action.onSelect}
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
