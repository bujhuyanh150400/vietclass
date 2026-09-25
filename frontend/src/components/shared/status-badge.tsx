import { InlineBadge } from "@/components/shared/inline-badge";

/** The built-in lifecycle statuses; more statuses can be added to the map below. */
export type StatusBadgeStatus = "active" | "inactive";

/** A label override lets each domain keep its own reader-facing wording. */
export type StatusBadgeLabels = Partial<Record<StatusBadgeStatus, string>>;

const STATUS_LABELS: Record<StatusBadgeStatus, string> = {
  active: "Đang mở",
  inactive: "Đã khóa",
};

const STATUS_TYPES: Record<StatusBadgeStatus, "success" | "danger"> = {
  active: "success",
  inactive: "danger",
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
    <InlineBadge
      type={STATUS_TYPES[status]}
      className="font-sans text-[11px] font-bold whitespace-nowrap"
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label ?? STATUS_LABELS[status]}
    </InlineBadge>
  );
}
