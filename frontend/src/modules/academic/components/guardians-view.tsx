"use client";

import Link from "next/link";
import { ArrowDownAZ, ArrowDownZA, ArrowUpDown, RefreshCw } from "lucide-react";

import {
  ConditionTag,
  ConditionsBar,
  DataTablePagination,
  FilterPopover,
  FilterSection,
  ListSheet,
  ListToolbar,
  SortPopover,
  StatePanel,
  ViewPopover,
  type DataTableState,
  type SortOption,
} from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useHasFeature } from "@/modules/auth";
import type { PageMeta } from "@/lib/api/contracts";

import type { Guardian } from "../types/academic";
import {
  guardianCanMutate,
  GUARDIAN_LIST_SORT_LABELS,
  type GuardianListSort,
  type GuardianListView,
} from "../utils/guardian-list-controls";
import { GRADE_LEVEL_LABELS, GUARDIAN_RELATIONSHIP_LABELS } from "../utils/labels";

const SORT_OPTIONS: SortOption<GuardianListSort>[] = [
  { value: "newest", label: GUARDIAN_LIST_SORT_LABELS.newest, icon: <ArrowUpDown aria-hidden="true" className="size-3.5" /> },
  { value: "date-asc", label: GUARDIAN_LIST_SORT_LABELS["date-asc"], icon: <ArrowUpDown aria-hidden="true" className="size-3.5" /> },
  { value: "name-asc", label: GUARDIAN_LIST_SORT_LABELS["name-asc"], icon: <ArrowDownAZ aria-hidden="true" className="size-3.5" /> },
  { value: "name-desc", label: GUARDIAN_LIST_SORT_LABELS["name-desc"], icon: <ArrowDownZA aria-hidden="true" className="size-3.5" /> },
];

/** Renders the guardian directory with the shared ListSheet pattern from the design artifact. */
export function GuardiansView({
  state,
  meta,
  search,
  sort,
  view,
  onSearch,
  onSortChange,
  onViewChange,
  onClearConditions,
  onPageChange,
  onView,
}: {
  state: DataTableState<Guardian>;
  meta: PageMeta;
  search: string;
  sort: GuardianListSort;
  view: GuardianListView;
  onSearch: (value: string) => void;
  onSortChange: (sort: GuardianListSort) => void;
  onViewChange: (view: GuardianListView) => void;
  onClearConditions: () => void;
  onPageChange: (page: number) => void;
  onView: (guardian: Guardian) => void;
}) {
  const currentUser = useCurrentUser(true);
  const canCreate = guardianCanMutate(currentUser.data?.role, useHasFeature("guardian.create"));
  const hasConditions = search !== "" || sort !== "newest";

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Hồ sơ học vụ</p>
          <h1 className="text-3xl font-semibold">Người giám hộ</h1>
          <p className="mt-1 text-sm text-muted-foreground">Thông tin liên hệ và kết nối với từng học sinh.</p>
          {currentUser.data?.role === 1 ? <p className="mt-2 text-xs font-medium text-muted-foreground">Giáo viên · Chỉ xem</p> : null}
        </div>
        {canCreate ? <Button asChild><Link href="/academic/guardians/new">Thêm người giám hộ</Link></Button> : null}
      </header>
      <ListSheet
        toolbar={
          <ListToolbar
            search={search}
            onSearchChange={onSearch}
            searchPlaceholder="Tìm người giám hộ, số điện thoại hoặc học sinh…"
            searchAriaLabel="Tìm người giám hộ, số điện thoại hoặc học sinh"
            searchHelpText="Tìm theo họ tên, số điện thoại hoặc tên học sinh liên kết."
            align="start"
            size="control"
          >
            <FilterPopover compact count={0} onClear={() => undefined} note="Danh sách hiển thị toàn bộ hồ sơ bạn được phép xem.">
              <FilterSection label="Phạm vi" last><span className="text-xs text-muted-foreground">Tất cả người giám hộ</span></FilterSection>
            </FilterPopover>
            <SortPopover compact value={sort} options={SORT_OPTIONS} onChange={onSortChange} isActive={sort !== "newest"} />
            <ViewPopover compact value={view} onChange={onViewChange} note="Dạng thẻ phù hợp trên màn hình hẹp." />
          </ListToolbar>
        }
        conditions={hasConditions ? <ConditionsBar heading="Đang áp dụng" onClearAll={onClearConditions}>{search ? <ConditionTag tone="neutral" caption="Từ khóa" label={`“${search}”`} onRemove={() => onSearch("")} /> : null}{sort !== "newest" ? <ConditionTag tone="neutral" caption="Sắp xếp" label={GUARDIAN_LIST_SORT_LABELS[sort]} onRemove={() => onSortChange("newest")} /> : null}</ConditionsBar> : undefined}
        pager={state.kind === "content" ? <DataTablePagination numbered unit="hồ sơ" meta={meta} onPageChange={onPageChange} /> : undefined}
      >
        <div aria-busy={state.kind === "loading"}>
          <GuardianResults state={state} view={view} hasConditions={hasConditions} onClearConditions={onClearConditions} onView={onView} />
        </div>
      </ListSheet>
    </div>
  );
}

/** Shows the shared list states and the artifact's table/card guardian content. */
function GuardianResults({ state, view, hasConditions, onClearConditions, onView }: { state: DataTableState<Guardian>; view: GuardianListView; hasConditions: boolean; onClearConditions: () => void; onView: (guardian: Guardian) => void }) {
  if (state.kind === "loading") return <div className="p-8 text-center text-sm text-muted-foreground">Đang tải danh sách người giám hộ…</div>;
  if (state.kind === "error") return <StatePanel role="alert" image="/images/error.webp" imageAlt="Chú cú VietClasses hoa mắt vì tải dữ liệu thất bại" title="Chưa tải được danh sách" description={state.message} action={<Button variant="outline" size="sm" onClick={state.onRetry}><RefreshCw aria-hidden="true" /> Thử lại</Button>} />;
  if (state.kind === "empty") return <StatePanel image={hasConditions ? "/images/empty_2.png" : "/images/empty_1.png"} imageAlt={hasConditions ? "Chú cú VietClasses cầm kính lúp tìm kiếm" : "Chú cú VietClasses vẫy chào"} title={hasConditions ? "Không tìm thấy kết quả" : "Chưa có người giám hộ"} description={hasConditions ? "Thử từ khóa khác hoặc xóa điều kiện để xem đầy đủ danh sách." : "Thêm hồ sơ đầu tiên và liên kết với ít nhất một học sinh."} action={hasConditions ? <Button variant="outline" size="sm" onClick={onClearConditions}>Xóa điều kiện</Button> : undefined} />;

  const cards = <div className="grid gap-3 p-4 md:grid-cols-2">{state.rows.map((guardian) => <button key={guardian.id} type="button" className="grid gap-3 rounded-lg border border-vc-rule bg-card p-4 text-left shadow-vc-sheet" onClick={() => onView(guardian)}><span className="flex items-center justify-between gap-3"><span className="font-semibold">{guardian.full_name}</span><span className="text-xs text-muted-foreground">{guardian.students.length} học sinh</span></span><span className="grid gap-1 text-sm text-muted-foreground"><span>{guardian.phone}</span><span>{guardian.email ?? "Chưa bổ sung email"}</span></span><span className="grid gap-1 border-t border-vc-rule pt-3 text-xs">{guardian.students.slice(0, 3).map((student) => <span key={student.id} className="flex flex-wrap items-center justify-between gap-2"><span>{student.full_name}</span><span className="text-muted-foreground">{GRADE_LEVEL_LABELS[student.grade_level]} · {GUARDIAN_RELATIONSHIP_LABELS[student.relationship]}{student.is_primary ? " · Liên hệ chính" : ""}</span></span>)}</span></button>)}</div>;
  const table = <div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[820px] table-fixed text-sm" aria-label="Danh sách người giám hộ"><thead><tr className="border-b border-vc-rule bg-vc-paper text-left text-[11px] uppercase tracking-[0.06em] text-muted-foreground"><th className="w-[35%] px-3 py-3">Người giám hộ</th><th className="w-[25%] px-3 py-3">Liên hệ</th><th className="w-[40%] px-3 py-3">Học sinh liên kết</th></tr></thead><tbody>{state.rows.map((guardian) => <tr key={guardian.id} className="border-b border-vc-rule hover:bg-vc-tint"><td className="px-3 py-4 align-top"><button type="button" className="text-left font-medium hover:underline" onClick={() => onView(guardian)}><span className="block">{guardian.full_name}</span><span className="mt-1 block text-xs text-muted-foreground">{guardian.students.length} học sinh liên kết</span></button></td><td className="px-3 py-4 align-top"><div className="grid gap-1 text-xs"><span className="font-mono">{guardian.phone}</span><span className="text-muted-foreground">{guardian.email ?? "Chưa bổ sung"}</span></div></td><td className="px-3 py-4 align-top"><div className="grid gap-1.5 text-xs">{guardian.students.map((student) => <span key={student.id} className="flex flex-wrap items-center gap-1"><span className="font-medium">{student.full_name}</span><span className="text-muted-foreground">{GRADE_LEVEL_LABELS[student.grade_level]} · {GUARDIAN_RELATIONSHIP_LABELS[student.relationship]}{student.is_primary ? " · Liên hệ chính" : ""}</span></span>)}</div></td></tr>)}</tbody></table></div>;

  return <>{view === "grid" ? cards : <>{table}<div className="lg:hidden">{cards}</div></>}</>;
}
