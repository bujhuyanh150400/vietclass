import { cn } from "@/lib/utils/index";

/** The built-in lifecycle statuses; more statuses can be added to the map below. */
export type StatusBadgeStatus = "active" | "inactive";

/** A label override lets each domain keep its own reader-facing wording. */
export type StatusBadgeLabels = Partial<Record<StatusBadgeStatus, string>>;

const STATUS_LABELS: Record<StatusBadgeStatus, string> = {
  active: "Đang mở",
  inactive: "Đã khóa",
};

const STATUS_TONES: Record<StatusBadgeStatus, string> = {
  active: "border-vc-leaf/30 bg-vc-leaf/10 text-vc-leaf",
  inactive: "border-destructive/25 bg-destructive/10 text-destructive",
};

/** Renders any lifecycle status with the shared dot, tint, and compact geometry. */
export function StatusBadge({
  status,
  label,
}: {
  status: StatusBadgeStatus;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-control border px-2 py-1 text-[11px] font-bold whitespace-nowrap",
        STATUS_TONES[status],
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label ?? STATUS_LABELS[status]}
    </span>
  );
}
