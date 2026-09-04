"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListToolbar } from "@/components/shared/data-table";

import type { FileCategory, FileOwnerOption } from "../types/files";

const CATEGORIES: Array<{ value: FileCategory; label: string }> = [
  { value: "image", label: "Hình ảnh" },
  { value: "pdf", label: "PDF" },
  { value: "document", label: "Tài liệu" },
  { value: "spreadsheet", label: "Bảng tính" },
  { value: "presentation", label: "Trình chiếu" },
  { value: "text", label: "Văn bản" },
];

/** Renders URL-backed search and library filters without owning their state. */
export function FileListToolbar({
  search,
  category,
  trash,
  owners,
  ownerUserId,
  isAdmin,
  onSearchChange,
  onCategoryChange,
  onTrashChange,
  onOwnerChange,
}: {
  search: string;
  category: FileCategory | null;
  trash: "active" | "trashed";
  owners: FileOwnerOption[];
  ownerUserId: number | null;
  isAdmin: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: FileCategory | null) => void;
  onTrashChange: (value: "active" | "trashed") => void;
  onOwnerChange: (value: number | null) => void;
}) {
  return (
    <ListToolbar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Tìm theo tên tệp"
      searchAriaLabel="Tìm kiếm tệp"
    >
      <Select value={category ?? "all"} onValueChange={(value) => onCategoryChange(value === "all" ? null : value as FileCategory)}>
        <SelectTrigger aria-label="Loại tệp" className="w-full sm:w-40"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">Mọi loại</SelectItem>{CATEGORIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={trash} onValueChange={(value) => onTrashChange(value as "active" | "trashed")}>
        <SelectTrigger aria-label="Trạng thái tệp" className="w-full sm:w-36"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="active">Đang dùng</SelectItem><SelectItem value="trashed">Thùng rác</SelectItem></SelectContent>
      </Select>
      {isAdmin ? (
        <Select value={ownerUserId === null ? "all" : String(ownerUserId)} onValueChange={(value) => onOwnerChange(value === "all" ? null : Number(value))}>
          <SelectTrigger aria-label="Chủ sở hữu tệp" className="w-full sm:w-48"><SelectValue placeholder="Chủ sở hữu" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Mọi chủ sở hữu</SelectItem>{owners.map((owner) => <SelectItem key={owner.id} value={String(owner.id)}>{owner.label}</SelectItem>)}</SelectContent>
        </Select>
      ) : null}
    </ListToolbar>
  );
}
