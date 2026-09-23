"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useCurrentUser, useHasFeature } from "@/modules/auth";
import { Button } from "@/components/ui/button";
import { isApiClientError } from "@/lib/api/api-client-error";

import { GuardianForm } from "../components/guardian-form";
import { useCreateGuardian, useStudentOptions, useUpdateGuardian } from "../hooks/use-guardian-records";
import type { Guardian } from "../types/academic";
import type { GuardianRequest } from "../types/academic-requests";
import { buildGuardianUpdatePayload, guardianCanMutate } from "../utils/guardian-list-controls";

/** Coordinates the guardian form, existing student picker, and mutation boundary. */
export function GuardianFormContainer({ guardian }: { guardian?: Guardian }) {
  const router = useRouter();
  const currentUser = useCurrentUser(true);
  const canMutate = guardianCanMutate(
    currentUser.data?.role,
    useHasFeature(guardian === undefined ? "guardian.create" : "guardian.update"),
  );
  const create = useCreateGuardian();
  const update = useUpdateGuardian(guardian?.id ?? 0);
  const students = useStudentOptions(guardian?.students.map((student) => student.id));
  const [duplicate, setDuplicate] = useState<{ id: number; name: string } | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [values, setValues] = useState<GuardianRequest>({
    full_name: guardian?.full_name ?? "",
    phone: guardian?.phone ?? "",
    email: guardian?.email ?? null,
    gender: guardian?.gender ?? 0,
    address: guardian?.address ?? null,
    note: guardian?.note ?? null,
    students: guardian?.students.map(({ id, relationship, is_primary }) => ({ student_profile_id: id, relationship, is_primary })) ?? [],
  });

  useEffect(() => {
    if (currentUser.isPending) return;
    if (!canMutate) router.replace(guardian ? `/academic/guardians/${guardian.id}` : "/academic/guardians");
  }, [canMutate, currentUser.isPending, guardian, router]);

  if (currentUser.isPending || !canMutate) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (values.students.length === 0) return;
    setDuplicate(null);
    setMutationError(null);
    try {
      const payload = buildGuardianUpdatePayload(values);
      if (guardian) await update.mutateAsync(payload); else await create.mutateAsync(payload);
      router.push(guardian ? `/academic/guardians/${guardian.id}` : "/academic/guardians");
    } catch (error) {
      if (isApiClientError(error) && error.status === 409 && error.meta.existing_guardian_id !== undefined) {
        setDuplicate({ id: error.meta.existing_guardian_id, name: error.meta.existing_guardian_name ?? "hồ sơ đã có" });
      } else {
        setMutationError(isApiClientError(error) ? error.message : "Không lưu được hồ sơ phụ huynh.");
      }
    }
  };

  return (
    <section className="grid gap-5">
      <h1 className="text-3xl font-semibold">{guardian ? "Sửa hồ sơ phụ huynh" : "Thêm người giám hộ"}</h1>
      {duplicate ? <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">Đã có hồ sơ trùng tên và số điện thoại: <strong>{duplicate.name}</strong>. <Button type="button" variant="link" className="h-auto p-0" onClick={() => router.push(`/academic/guardians/${duplicate.id}`)}>Dùng hồ sơ đã có</Button></div> : null}
      {mutationError ? <p role="alert" className="text-sm text-destructive">{mutationError}</p> : null}
      <GuardianForm
        values={values}
        students={students.data ?? []}
        guardianId={guardian?.id}
        guardianStudentIds={guardian?.students.map((student) => student.id)}
        pending={create.isPending || update.isPending}
        onChange={setValues}
        onSubmit={(event) => void submit(event)}
        onCancel={() => router.back()}
      />
    </section>
  );
}
