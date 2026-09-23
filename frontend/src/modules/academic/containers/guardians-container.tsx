"use client";

import { useRouter } from "next/navigation";

import { GuardiansView } from "../components/guardians-view";
import { useGuardianRecords } from "../hooks/use-guardian-records";

/** Coordinates guardian list controls and detail navigation. */
export function GuardiansContainer() {
  const router = useRouter();
  const list = useGuardianRecords();

  return (
    <GuardiansView
      state={list.state}
      meta={list.meta}
      search={list.query.q}
      sort={list.sort}
      view={list.view}
      onSearch={list.query.setSearch}
      onSortChange={list.setSort}
      onViewChange={list.setView}
      onClearConditions={list.clearConditions}
      onPageChange={list.query.setPage}
      onView={(guardian) => router.push(`/academic/guardians/${guardian.id}`)}
    />
  );
}
