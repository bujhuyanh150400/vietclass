import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Renders the owl app mark on its own — the same artwork shipped as the favicon
 * and PWA icon, so the mark in the interface is the mark on the home screen.
 *
 * It points at a trimmed copy rather than the icon set directly: the launcher
 * icons carry ~20% transparent padding so they sit correctly inside a platform
 * mask, which at 24px would waste a fifth of an already small box. The source
 * of truth is still app-icons — regenerate with:
 *   sharp('public/app-icons/web/icon-512.png').trim() → square → resize(128)
 *
 * The mark is deliberately not pixel-sampled. `image-rendering: pixelated` only
 * helps when pixel art is scaled *up*; this is scaled far down, where
 * nearest-neighbour drops whole pixels and the owl breaks apart.
 *
 * Callers size it, because the sidebar rail collapses to a narrower box than
 * the login screen's header allows.
 */
export function BrandIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/images/brand-mark.png"
      alt=""
      aria-hidden="true"
      width={128}
      height={128}
      priority
      className={cn("shrink-0 object-contain", className)}
    />
  );
}

/**
 * Renders the full product lockup: the app icon beside the wordmark. The name
 * is set in a bitmap face so the brand speaks at the same resolution as the
 * icon artwork. `tone` picks the wordmark color for the dark desk column or a
 * light surface.
 *
 * `caption` adds the strapline beneath the name. It sits inside the wordmark
 * rather than beside it so the two move as one block, and it is opt-in because
 * the login screen already states what the product is in its own headline —
 * only the sidebar, where the lockup stands alone, needs the explanation.
 */
export function BrandMark({
  tone,
  caption,
  className,
}: {
  tone: "desk" | "paper";
  caption?: string;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandIcon className="size-7" />
      <span
        className={cn(
          "vc-app-brand-name font-pixel text-[0.8rem] leading-none tracking-[0.06em]",
          tone === "desk" ? "text-vc-paper" : "text-vc-text",
        )}
      >
        VIETCLASSES
        {caption ? (
          <span className="vc-app-brand-caption font-sans">{caption}</span>
        ) : null}
      </span>
    </span>
  );
}
