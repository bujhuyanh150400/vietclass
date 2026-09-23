"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useCurrentUser, useHasFeature } from "@/modules/auth";

import { GuardianDeleteDialog } from "../components/guardian-delete-dialog";
import { GuardianDetailView } from "../components/guardian-detail-view";
import { useGuardianRecord } from "../hooks/use-guardian-records";
import { useState } from "react";

import { guardianCanMutate } from "../utils/guardian-list-controls";

/** Renders one guardian detail and exposes mutation links only to Admin. */
export function GuardianDetailContainer({ id }: { id: number }) {
  const router = useRouter();
  const record = useGuardianRecord(id);
  const currentUser = useCurrentUser(true);
  const canUpdate = guardianCanMutate(currentUser.data?.role, useHasFeature("guardian.update"));
  const canDelete = guardianCanMutate(currentUser.data?.role, useHasFeature("guardian.delete"));
  const guardian = record.data;
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (record.isPending) return <p>Đang tải hồ sơ…</p>;
  if (record.isError || guardian === undefined) return <p role="alert">Không tìm thấy hồ sơ phụ huynh.</p>;

  return (
    <section className="grid gap-5">
      <Link href="/academic/guardians" className="text-sm text-muted-foreground">← Danh sách phụ huynh</Link>
      <header className="flex flex-wrap justify-between gap-3">
        <div><p className="text-xs text-muted-foreground">Hồ sơ phụ huynh</p><h1 className="text-3xl font-semibold">{guardian.full_name}</h1><p className="text-sm text-muted-foreground">{guardian.phone}</p></div>
        {canUpdate ? <Button asChild><Link href={`/academic/guardians/${id}/edit`}>Sửa hồ sơ</Link></Button> : null}
      </header>
      <GuardianDetailView guardian={guardian} />
      {canDelete ? <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Xóa hồ sơ</Button> : null}
      {canDelete ? <GuardianDeleteDialog guardian={guardian} open={deleteOpen} onOpenChange={setDeleteOpen} onDeleted={() => router.push("/academic/guardians")} /> : null}
    </section>
  );
}
