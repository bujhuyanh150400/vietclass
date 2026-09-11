import Image from "next/image";
import type { ReactNode } from "react";

/**
 * Renders the whole data region of a list screen when there are no rows to
 * show: nothing added yet, nothing matching the current conditions, or a failed
 * load.
 *
 * Unlike EmptyState, which is sized to sit inside a table, this takes over the
 * region outright and gives the mascot artwork room to read, so the screen
 * looks deliberately at rest rather than broken.
 *
 * The illustration carries real alt text rather than being hidden, because each
 * mascot pose says something the heading does not — it distinguishes "nothing
 * here yet" from "your search found nothing" before the text is read.
 */
export function StatePanel({
  image,
  imageAlt,
  title,
  description,
  action,
  role,
}: {
  image: string;
  imageAlt: string;
  title: string;
  description?: string;
  action?: ReactNode;
  role?: "alert";
}) {
  return (
    <div
      role={role}
      className="grid min-h-[360px] place-items-center px-4 py-[34px] text-center md:min-h-[420px] md:px-5 md:py-12"
    >
      <div className="grid justify-items-center">
        {/* The artwork is pixel art, so it is resampled with hard edges rather
            than smoothed into a blur at this size. */}
        <Image
          src={image}
          alt={imageAlt}
          width={142}
          height={142}
          className="size-[142px] object-contain [image-rendering:pixelated]"
        />
        {/*
          `h3`: the topbar owns each protected screen's `h1` and a screen's own
          title starts at `h2`, so a panel standing in for one region inside that
          screen sits a level below it.
        */}
        <h3 className="mt-2 mb-1.5 text-[22px] font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mb-4.5 max-w-[52ch] text-sm leading-[1.55] text-muted-foreground">
            {description}
          </p>
        ) : null}
        {action}
      </div>
    </div>
  );
}
