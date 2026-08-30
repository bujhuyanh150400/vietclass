"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/index";

/** The mascot loop this overlay shows. */
const ANIMATION_SRC = "/animations/vietclass-owl-reading-thinking-loop.lottie";

/** Captions shown under the title, picked at random each time the overlay opens. */
const PROMPTS = [
  "Đang tổng hợp dữ liệu, chờ một chút nhé…",
  "Cú đang lật từng trang sổ điểm…",
  "Sắp xong rồi, cảm ơn bạn đã kiên nhẫn…",
  "Đang kết nối tới máy chủ VietClasses…",
  "Một chút nữa thôi là có kết quả…",
  "Cú đang suy nghĩ cách sắp xếp lớp học…",
];

/** Shortest time the overlay stays fully visible once shown, so a fast task never just flashes it. */
const MIN_VISIBLE_MS = 1200;
/** How long the bar sits at 100% before the overlay starts its exit animation. */
const COMPLETE_HOLD_MS = 350;
/** How often the simulated progress advances. */
const PROGRESS_TICK_MS = 200;
/** Fade duration for the entrance and the exit, in seconds (Motion's unit). */
const FADE_SECONDS = 0.25;

/** Picks a random item from a non-empty list. */
function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const OVERLAY_CLASS_NAME =
  "fixed inset-0 z-[60] grid place-items-center bg-background/95 backdrop-blur-sm";

/**
 * Renders a full-viewport "please wait" overlay: the mascot animation, a fixed
 * title, a random rotating caption, and a simulated progress bar.
 *
 * The overlay owns its own exit timing so a fast task never just flashes it on and
 * off: once shown it stays for at least `MIN_VISIBLE_MS`, eases its bar to 100%,
 * holds briefly, and only then hands off to `AnimatePresence` for the fade-out and
 * unmount. It is generic — reused wherever the app tracks a loading boolean (a
 * route's `loading.tsx`, a form submission, a dialog action) rather than being
 * specific to any one of them.
 *
 * Under `prefers-reduced-motion`, the overlay skips Motion entirely and mounts or
 * unmounts outright: besides respecting the preference, `AnimatePresence`'s exit
 * never resolves once Motion disables the animation for that preference, which
 * would otherwise leave the overlay stuck on screen.
 */
export function LoadingState({
  open,
  title = "Chờ chút xíu…",
  className,
}: {
  open: boolean;
  title?: string;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  const [appliedOpen, setAppliedOpen] = useState(open);
  const [reveal, setReveal] = useState(open);
  const [progress, setProgress] = useState(0);
  const [prompt, setPrompt] = useState(() => pickRandom(PROMPTS));

  // Reveals the instant `open` turns true, mirroring the pattern DataTableToolbar
  // uses for reacting to a prop change during render: it commits in the same pass,
  // without the extra render an effect would cost, leaving the effect below free to
  // handle only the delayed side of the transition — closing.
  if (open !== appliedOpen) {
    setAppliedOpen(open);

    if (open) {
      setReveal(true);
      setPrompt(pickRandom(PROMPTS));
      setProgress(0);
    }
  }

  const openedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (open) {
      openedAtRef.current = Date.now();

      const interval = setInterval(() => {
        // Eases toward 90% and never quite reaches it, so a task that takes longer
        // than expected never looks stalled at a suspiciously round number.
        setProgress((current) => current + (90 - current) * 0.15);
      }, PROGRESS_TICK_MS);

      return () => clearInterval(interval);
    }

    if (openedAtRef.current === null) {
      return;
    }

    const elapsed = Date.now() - openedAtRef.current;
    const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0);

    const holdTimer = setTimeout(() => {
      setProgress(100);

      const closeTimer = setTimeout(() => {
        setReveal(false);
        openedAtRef.current = null;
      }, COMPLETE_HOLD_MS);

      timers.push(closeTimer);
    }, remaining);

    timers.push(holdTimer);

    return () => timers.forEach(clearTimeout);
  }, [open]);

  const card = (
    <div className="grid max-w-xs justify-items-center gap-4 text-center">
      <DotLottieReact
        src={ANIMATION_SRC}
        loop
        autoplay
        className="size-40"
      />
      <div className="grid gap-1">
        <p className="text-lg font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{prompt}</p>
      </div>
      <Progress value={progress} className="h-1.5 w-48" />
    </div>
  );

  if (prefersReducedMotion) {
    if (!reveal) {
      return null;
    }

    return (
      <div role="status" aria-live="polite" className={cn(OVERLAY_CLASS_NAME, className)}>
        {card}
      </div>
    );
  }

  return (
    <AnimatePresence>
      {reveal ? (
        <motion.div
          key="loading-state"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_SECONDS }}
          className={cn(OVERLAY_CLASS_NAME, className)}
        >
          {card}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
