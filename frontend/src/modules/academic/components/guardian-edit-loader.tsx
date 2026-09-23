"use client";

import { GuardianFormContainer } from "../containers/guardian-form-container";
import { useGuardianRecord } from "../hooks/use-guardian-records";

/** Loads the guardian edit record before rendering the shared mutation form. */
export function GuardianEditLoader({ id }: { id: number }) {
  const query = useGuardianRecord(id);
  if (query.isPending) return <p>Đang tải hồ sơ…</p>;
  if (query.isError || query.data === undefined) return <p role="alert">Không tìm thấy hồ sơ phụ huynh.</p>;
  return <GuardianFormContainer guardian={query.data} />;
}
