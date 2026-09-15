"use client";

import { Progress } from "@/components/ui/progress";
import type { FileUsage } from "../types/files";

/** Formats stored byte counts for a compact human-readable quota display. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

/** Displays a resolved owner's used, remaining, and exceeded quota state. */
export function FileUsageMeter({ usage }: { usage: FileUsage }) {
  const progress = usage.quota_bytes === 0 ? 100 : Math.min(100, (usage.used_bytes / usage.quota_bytes) * 100);

  return (
    <div className="grid gap-2 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-medium">Dung lượng</p><p className="text-sm text-muted-foreground">{formatFileSize(usage.used_bytes)} / {formatFileSize(usage.quota_bytes)}</p></div>
      <Progress value={progress} className={usage.exceeded ? "[&>div]:bg-destructive" : undefined} />
      <p className={usage.exceeded ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{usage.exceeded ? "Đã vượt hạn mức." : `Còn ${formatFileSize(usage.remaining_bytes)}.`}</p>
    </div>
  );
}
