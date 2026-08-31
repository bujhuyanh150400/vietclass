import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/index";

/**
 * Renders the way back out of a screen the visitor navigated into.
 *
 * It points at an explicit destination rather than stepping through history, so a
 * screen opened directly from a link or a bookmark still offers somewhere sensible
 * to go, and the label always names where that is.
 */
export function BackLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("justify-self-start -ml-2", className)}
      asChild
    >
      <Link href={href}>
        <ArrowLeft aria-hidden="true" />
        {label}
      </Link>
    </Button>
  );
}
