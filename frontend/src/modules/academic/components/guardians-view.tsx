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
import { guardianCanMutate, GUARDIAN_LIST_SORT_LABELS, type GuardianListSort, type GuardianListView } from "../utils/guardian-list-controls";

const SORT_OPTIONS: SortOption<GuardianListSort>[] = [
  { value: "newest", label: GUARDIAN_LIST_SORT_LABELS.newest, icon: <ArrowUpDown aria-hidden="true" className="size-3.5" /> },
  { value: "date-asc", label: GUARDIAN_LIST_SORT_LABELS["date-asc"], icon: <ArrowUpDown aria-hidden="true" className="size-3.5" /> },
  { value: "name-asc", label: GUARDIAN_LIST_SORT_LABELS["name-asc"], icon: <ArrowDownAZ aria-hidden="true" className="size-3.5" /> },
  { value: "name-desc", label: GUARDIAN_LIST_SORT_LABELS["name-desc"], icon: <ArrowDownZA aria-hidden="true" className="size-3.5" /> },
];

/** Renders the guardian directory with ListSheet controls and explicit read states. */
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
        <div><p className="text-xs text-muted-foreground">Danh bạ học vụ</p><h1 className="text-3xl font-semibold">Quản lý phụ huynh</h1><p className="mt-1 text-sm text-muted-foreground">Danh sách toàn bộ hồ sơ liên hệ và học sinh liên kết.</p>{currentUser.data?.role === 1 ? <p className="mt-2 text-xs font-medium text-muted-foreground">Giáo viên · Chỉ xem</p> : null}</div>
        {canCreate ? <Button asChild><Link href="/academic/guardians/new">Thêm người giám hộ</Link></Button> : null}
      </header>
      <ListSheet
        toolbar={<ListToolbar search={search} onSearchChange={onSearch} searchPlaceholder="Tìm theo họ tên hoặc số điện thoại" searchAriaLabel="Tìm phụ huynh" align="start" size="control"><FilterPopover compact count={0} onClear={() => undefined} note="Danh sách hiển thị toàn bộ hồ sơ bạn được phép xem."><FilterSection label="Phạm vi" last><span className="text-xs text-muted-foreground">Tất cả hồ sơ phụ huynh</span></FilterSection></FilterPopover><SortPopover compact value={sort} options={SORT_OPTIONS} onChange={onSortChange} isActive={sort !== "newest"} /><ViewPopover compact value={view} onChange={onViewChange} note="Dạng thẻ phù hợp trên màn hình hẹp." /></ListToolbar>}
        conditions={hasConditions ? <ConditionsBar heading="Đang áp dụng" onClearAll={onClearConditions}>{search ? <ConditionTag tone="neutral" caption="Từ khóa" label={`“${search}”`} onRemove={() => onSearch("")} /> : null}{sort !== "newest" ? <ConditionTag tone="neutral" caption="Sắp xếp" label={GUARDIAN_LIST_SORT_LABELS[sort]} onRemove={() => onSortChange("newest")} /> : null}</ConditionsBar> : undefined}
        pager={state.kind === "content" ? <DataTablePagination numbered unit="hồ sơ" meta={meta} onPageChange={onPageChange} /> : undefined}
      >
        <div aria-busy={state.kind === "loading"}><GuardianResults state={state} view={view} hasConditions={hasConditions} onClearConditions={onClearConditions} onView={onView} /></div>
      </ListSheet>
    </div>
  );
}

/** Shows loading, error, empty, and one shared guardian dataset responsively. */
function GuardianResults({ state, view, hasConditions, onClearConditions, onView }: { state: DataTableState<Guardian>; view: GuardianListView; hasConditions: boolean; onClearConditions: () => void; onView: (guardian: Guardian) => void }) {
  if (state.kind === "loading") return <div className="p-8 text-center text-sm text-muted-foreground">Đang tải danh sách…</div>;
  if (state.kind === "error") return <StatePanel role="alert" image="/images/error.webp" imageAlt="Chú cú VietClasses hoa mắt vì tải dữ liệu thất bại" title="Chưa tải được danh sách" description={state.message} action={<Button variant="outline" size="sm" onClick={state.onRetry}><RefreshCw aria-hidden="true" /> Thử lại</Button>} />;
  if (state.kind === "empty") return <StatePanel image={hasConditions ? "/images/empty_2.png" : "/images/empty_1.png"} imageAlt={hasConditions ? "Chú cú VietClasses cầm kính lúp tìm kiếm" : "Chú cú VietClasses vẫy chào"} title={hasConditions ? "Không tìm thấy kết quả" : "Chưa có hồ sơ phụ huynh"} description={hasConditions ? "Thử bỏ bớt điều kiện tìm kiếm." : "Tạo hồ sơ đầu tiên để bắt đầu."} action={hasConditions ? <Button variant="outline" size="sm" onClick={onClearConditions}>Xóa điều kiện</Button> : undefined} />;
  const cards = <div className="grid gap-3 md:grid-cols-2">{state.rows.map((guardian) => <button key={guardian.id} type="button" className="rounded-lg border bg-card p-4 text-left shadow-sm" onClick={() => onView(guardian)}><span className="font-semibold">{guardian.full_name}</span><span className="mt-1 block text-sm text-muted-foreground">{guardian.phone} · {guardian.students.length} học sinh</span></button>)}</div>;
  return view === "grid" ? cards : <><div className="hidden lg:block overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Họ và tên</th><th className="p-3">Điện thoại</th><th className="p-3">Học sinh liên kết</th></tr></thead><tbody>{state.rows.map((guardian) => <tr key={guardian.id} className="border-b"><td className="p-3"><button type="button" className="font-medium hover:underline" onClick={() => onView(guardian)}>{guardian.full_name}</button></td><td className="p-3">{guardian.phone}</td><td className="p-3">{guardian.students.length}</td></tr>)}</tbody></table></div><div className="lg:hidden">{cards}</div></>;
}
