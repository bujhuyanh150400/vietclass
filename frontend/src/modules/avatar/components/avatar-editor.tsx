"use client";

import { Dices, Save } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { FilePondInput, fileContentUrl, type FilePondProcess, type ManagedFile } from "@/modules/files";

import type { AvatarSelection, AvatarValue } from "../types/avatar";
import { DiceBearFields, diceBear } from "./dicebear-fields";
import { UserAvatar } from "./user-avatar";

/** Converts a controlled selection into a renderable value using the active image library. */
function previewValue(value: AvatarSelection, files: ManagedFile[]): AvatarValue {
  if (value.type === "none") return null;
  if (value.type === "dicebear") return value;
  const file = files.find((candidate) => candidate.id === value.file_id);
  return file ? { type: "file", file_id: file.id, content_url: fileContentUrl(file.id) } : null;
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

        {value.type === "dicebear" ? <DiceBearFields value={value} onChange={onChange} /> : null}
        <Button type="button" className="w-fit" disabled={isPending} onClick={onSave}><Save aria-hidden="true" />{isPending ? "Đang lưu..." : "Lưu ảnh đại diện"}</Button>
      </CardContent>
    </Card>
  );
}
