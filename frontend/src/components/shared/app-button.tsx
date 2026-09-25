import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/index";

export type AppButtonProps = Omit<
  ComponentProps<typeof Button>,
  "asChild" | "children" | "className"
> & {
  children: ReactNode;
  className?: string;
  href?: string;
};

/** Renders the app-level button style as either a native button or a link. */
export function AppButton({
  children,
  variant = "default",
  size = "default",
  className,
  disabled = false,
  href,
  ...buttonProps
}: AppButtonProps) {
  const sizeClassName =
    size === "default"
      ? "h-11 w-full gap-2 has-[>svg]:px-[15px] md:w-auto"
      : size === "sm"
        ? "h-8 w-full gap-1.5 has-[>svg]:px-2.5 md:w-auto"
        : typeof size === "string" && size.startsWith("icon")
          ? undefined
          : "w-full md:w-auto";
  const variantClassName =
    variant === "default"
      ? "border border-vc-wood shadow-vc-raised motion-safe:active:translate-y-[2px] motion-safe:active:shadow-[0_1px_0_var(--vc-wood)]"
      : variant === "destructive"
        ? "border border-vc-wood shadow-vc-raised motion-safe:active:translate-y-[2px] motion-safe:active:shadow-[0_1px_0_var(--vc-wood)]"
        : variant === "outline"
          ? "border border-vc-control bg-background shadow-[0_2px_0_var(--vc-shell-rule)] hover:bg-vc-tint hover:text-foreground motion-safe:active:translate-y-px motion-safe:active:shadow-[0_1px_0_var(--vc-shell-rule)]"
          : variant === "secondary"
            ? "border border-vc-control shadow-[0_2px_0_var(--vc-shell-rule)] hover:bg-vc-tint hover:text-foreground motion-safe:active:translate-y-px motion-safe:active:shadow-[0_1px_0_var(--vc-shell-rule)]"
            : variant === "ghost"
              ? "border border-transparent shadow-none hover:bg-vc-tint hover:text-foreground motion-safe:active:translate-y-px"
              : "shadow-none";
  const buttonClassName = cn(
    sizeClassName,
    "rounded-control font-semibold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
    variantClassName,
    className,
  );

  if (href !== undefined) {
    return (
      <Button asChild size={size} variant={variant} className={buttonClassName}>
        <Link
          href={href}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : undefined}
          onClick={disabled ? (event) => event.preventDefault() : undefined}
        >
          {children}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      {...buttonProps}
      disabled={disabled}
      type={buttonProps.type ?? "button"}
      size={size}
      variant={variant}
      className={buttonClassName}
    >
      {children}
    </Button>
  );
}
