"use client";

import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { FileQuotaMap } from "../types/files";
import { formatFileSize } from "./file-usage-meter";

type QuotaDraft = Record<keyof FileQuotaMap, string>;

/** Converts a concise byte, KB, MB, or GB entry into an integer byte quota. */
function parseQuota(value: string): number | null {
  const match = /^\s*(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?\s*$/i.exec(value);
  if (!match) return null;
  const multiplier = ({ b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 } as const)[(match[2] ?? "b").toLowerCase() as "b" | "kb" | "mb" | "gb"];
  const bytes = Math.round(Number(match[1]) * multiplier);
  return Number.isSafeInteger(bytes) && bytes >= 0 ? bytes : null;
}

/** Builds editable human-size field values from the persisted byte quota map. */
function quotaDraft(quotas: FileQuotaMap): QuotaDraft {
  return { admin: formatFileSize(quotas.admin), teacher: formatFileSize(quotas.teacher), student: formatFileSize(quotas.student), guardian: formatFileSize(quotas.guardian) };
}

/** Lets administrators replace all role quotas with validated human-readable byte values. */
export function FileQuotaDialog({ open, quotas, isPending, errorMessage, onOpenChange, onSubmit }: { open: boolean; quotas: FileQuotaMap | undefined; isPending: boolean; errorMessage: string | null; onOpenChange: (open: boolean) => void; onSubmit: (quotas: FileQuotaMap) => void }) {
  const [observedQuotas, setObservedQuotas] = useState(quotas);
  const [draft, setDraft] = useState<QuotaDraft | null>(quotas ? quotaDraft(quotas) : null);
  const [parseError, setParseError] = useState<string | null>(null);

  if (quotas !== observedQuotas) {
    setObservedQuotas(quotas);
    setDraft(quotas ? quotaDraft(quotas) : null);
  }

  /** Validates each visible quota before sending a complete integer byte map upward. */
  function submit() {
    if (!draft) return;
    const values = Object.fromEntries(Object.entries(draft).map(([role, value]) => [role, parseQuota(value)])) as Record<keyof FileQuotaMap, number | null>;
    if (Object.values(values).some((value) => value === null)) { setParseError("Nhập dung lượng như 25 MB hoặc 1 GB."); return; }
    setParseError(null);
    onSubmit(values as FileQuotaMap);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Hạn mức lưu trữ</DialogTitle><DialogDescription>Nhập dung lượng theo B, KB, MB hoặc GB cho từng vai trò.</DialogDescription></DialogHeader>
        <div className="grid gap-3">{draft ? (Object.keys(draft) as Array<keyof FileQuotaMap>).map((role) => <div key={role} className="grid gap-1.5"><Label htmlFor={`quota-${role}`}>{({ admin: "Quản trị viên", teacher: "Giáo viên", student: "Học sinh", guardian: "Phụ huynh" } as Record<keyof FileQuotaMap, string>)[role]}</Label><Input id={`quota-${role}`} value={draft[role]} onChange={(event) => setDraft((current) => current ? { ...current, [role]: event.target.value } : current)} disabled={isPending} /></div>) : <p className="text-sm text-muted-foreground">Đang tải hạn mức…</p>}</div>
        {parseError || errorMessage ? <Alert variant="destructive"><AlertDescription>{parseError ?? errorMessage}</AlertDescription></Alert> : null}
        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Hủy</Button><Button type="button" onClick={submit} disabled={!draft || isPending}>{isPending ? "Đang lưu…" : "Lưu hạn mức"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
