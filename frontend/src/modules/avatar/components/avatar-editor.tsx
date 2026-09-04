"use client";

import { Dices, RotateCcw, Save } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilePondInput, fileContentUrl, type FilePondProcess, type ManagedFile } from "@/modules/files";

import type { AvatarSelection, AvatarValue, DiceBearAvatar, DiceBearOptionValue, DiceBearStyle } from "../types/avatar";
import { UserAvatar } from "./user-avatar";

const STYLES: { value: DiceBearStyle; label: string }[] = [
  { value: "lorelei", label: "Lorelei" },
  { value: "notionists", label: "Notionists" },
  { value: "thumbs", label: "Thumbs" },
];

/** Returns a valid minimal local DiceBear draft for the selected style. */
function diceBear(style: DiceBearStyle = "lorelei", seed = "avatar"): DiceBearAvatar {
  return { type: "dicebear", style, seed, options: {} };
}

/** Converts a controlled selection into a renderable value using the active image library. */
function previewValue(value: AvatarSelection, files: ManagedFile[]): AvatarValue {
  if (value.type === "none") return null;
  if (value.type === "dicebear") return value;
  const file = files.find((candidate) => candidate.id === value.file_id);
  return file ? { type: "file", file_id: file.id, content_url: fileContentUrl(file.id) } : null;
}

/** Replaces one optional scalar DiceBear control without allowing an invalid empty value through. */
function withOption(value: DiceBearAvatar, key: string, option: DiceBearOptionValue | undefined): DiceBearAvatar {
  const options = { ...value.options };
  if (option === undefined) delete options[key];
  else options[key] = option;
  return { ...value, options };
}

/** Presents the controlled avatar chooser; data fetching and mutations stay in its container. */
export function AvatarEditor({
  value,
  availableFiles,
  canSelectFile,
  onChange,
  onUpload,
  onSave,
  isPending = false,
  error,
}: {
  value: AvatarSelection;
  availableFiles: ManagedFile[];
  canSelectFile: boolean;
  onChange: (value: AvatarSelection) => void;
  onUpload?: FilePondProcess;
  onSave: () => void;
  isPending?: boolean;
  error?: string | null;
}) {
  const current = value.type === "dicebear" ? value : diceBear();
  const numberOption = (key: string): string => typeof current.options[key] === "number" ? String(current.options[key]) : "";
  const updateNumber = (key: string, raw: string, min: number, max: number) => {
    const parsed = Number(raw);
    onChange(withOption(current, key, raw === "" || !Number.isInteger(parsed) || parsed < min || parsed > max ? undefined : parsed));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ảnh đại diện</CardTitle>
        <CardDescription>Chọn ảnh đã tải lên hoặc tạo ảnh DiceBear ngay trên thiết bị.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <div className="flex flex-wrap items-center gap-4">
          <UserAvatar value={previewValue(value, availableFiles)} name="Ảnh đại diện" alt="Xem trước ảnh đại diện" size="lg" loading="eager" />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Kiểu ảnh đại diện">
            <Button type="button" variant={value.type === "none" ? "default" : "outline"} onClick={() => onChange({ type: "none" })}>Không dùng ảnh</Button>
            <Button type="button" variant={value.type === "file" ? "default" : "outline"} disabled={!canSelectFile} onClick={() => onChange(availableFiles[0] ? { type: "file", file_id: availableFiles[0].id } : { type: "none" })}>Ảnh đã tải</Button>
            <Button type="button" variant={value.type === "dicebear" ? "default" : "outline"} onClick={() => onChange(value.type === "dicebear" ? value : diceBear())}><Dices aria-hidden="true" />DiceBear</Button>
          </div>
        </div>

        {value.type === "file" || (value.type === "none" && canSelectFile) ? <div className="grid gap-3">
          <div className="grid gap-2"><Label>Ảnh có sẵn</Label><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {availableFiles.map((file) => <Button key={file.id} type="button" variant={value.type === "file" && value.file_id === file.id ? "default" : "outline"} className="h-auto justify-start" onClick={() => onChange({ type: "file", file_id: file.id })}><UserAvatar value={{ type: "file", file_id: file.id, content_url: fileContentUrl(file.id) }} name={file.display_name} alt="" size="sm" />{file.display_name}</Button>)}
            {availableFiles.length === 0 ? <p className="col-span-full text-sm text-muted-foreground">Chưa có ảnh nào trong thư viện.</p> : null}
          </div></div>
          {onUpload ? <div className="grid gap-2"><Label>Tải ảnh mới</Label><FilePondInput mode="avatar" disabled={!canSelectFile || isPending} labelIdle={'Kéo ảnh vào đây hoặc <span class="filepond--label-action">chọn ảnh</span>'} process={onUpload} /></div> : null}
        </div> : null}

        {!canSelectFile ? <Alert><AlertDescription>Hồ sơ chưa có tài khoản nên chỉ dùng được Không dùng ảnh hoặc DiceBear.</AlertDescription></Alert> : null}

        {value.type === "dicebear" ? <div className="grid gap-4 rounded-lg border p-4 dark:border-input">
          <div className="grid gap-2 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="avatar-style">Kiểu</Label><Select value={current.style} onValueChange={(style) => onChange(diceBear(style as DiceBearStyle, current.seed))}><SelectTrigger id="avatar-style"><SelectValue /></SelectTrigger><SelectContent>{STYLES.map((style) => <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="avatar-seed">Seed</Label><div className="flex gap-2"><Input id="avatar-seed" value={current.seed} maxLength={128} onChange={(event) => onChange({ ...current, seed: event.target.value })} /><Button type="button" variant="outline" size="icon" aria-label="Tạo seed mới" onClick={() => onChange({ ...current, seed: crypto.randomUUID() })}><Dices aria-hidden="true" /></Button></div></div></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="grid gap-2"><Label htmlFor="avatar-hair">Biến thể tóc (Lorelei)</Label><Select disabled={current.style !== "lorelei"} value={typeof current.options.hairVariant === "string" ? current.options.hairVariant : "none"} onValueChange={(next) => onChange(withOption(current, "hairVariant", next === "none" ? undefined : next))}><SelectTrigger id="avatar-hair"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Mặc định</SelectItem><SelectItem value="variant01">variant01</SelectItem></SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="avatar-probability">Xác suất tóc (Lorelei)</Label><Input id="avatar-probability" disabled={current.style !== "lorelei"} type="number" min="0" max="100" value={numberOption("hairProbability")} onChange={(event) => updateNumber("hairProbability", event.target.value, 0, 100)} /></div><div className="grid gap-2"><Label htmlFor="avatar-color">Màu nền</Label><Input id="avatar-color" type="color" value={typeof current.options.backgroundColor === "string" ? current.options.backgroundColor : "#e2e8f0"} onChange={(event) => onChange(withOption(current, "backgroundColor", event.target.value))} /></div><div className="grid gap-2"><Label htmlFor="avatar-scale">Tỷ lệ</Label><Input id="avatar-scale" type="number" min="0" max="10" value={numberOption("scale")} onChange={(event) => updateNumber("scale", event.target.value, 0, 10)} /></div></div>
          <div className="grid gap-3 sm:grid-cols-3"><div className="grid gap-2"><Label htmlFor="avatar-rotate">Xoay</Label><Input id="avatar-rotate" type="number" min="-360" max="360" value={numberOption("rotate")} onChange={(event) => updateNumber("rotate", event.target.value, -360, 360)} /></div><div className="grid gap-2"><Label htmlFor="avatar-x">Dịch ngang</Label><Input id="avatar-x" type="number" min="-1000" max="1000" value={numberOption("translateX")} onChange={(event) => updateNumber("translateX", event.target.value, -1000, 1000)} /></div><div className="grid gap-2"><Label htmlFor="avatar-y">Dịch dọc</Label><Input id="avatar-y" type="number" min="-1000" max="1000" value={numberOption("translateY")} onChange={(event) => updateNumber("translateY", event.target.value, -1000, 1000)} /></div></div>
          <Button type="button" variant="outline" className="w-fit" onClick={() => onChange({ ...current, options: {} })}><RotateCcw aria-hidden="true" />Đặt lại tùy chọn</Button>
        </div> : null}
        <Button type="button" className="w-fit" disabled={isPending} onClick={onSave}><Save aria-hidden="true" />{isPending ? "Đang lưu..." : "Lưu ảnh đại diện"}</Button>
      </CardContent>
    </Card>
  );
}
