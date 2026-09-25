import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** The mutually exclusive states a shared list can render. */
export type DataTableState<TRow> =
  | { kind: "loading" }
  | { kind: "error"; message: string; onRetry?: () => void }
  | {
      kind: "empty";
      message: string;
      description?: string;
      icon?: LucideIcon;
      image?: string;
      action?: ReactNode;
    }
  | { kind: "content"; rows: TRow[] };
