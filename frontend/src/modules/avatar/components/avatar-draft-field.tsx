"use client";

import { Dices, Upload } from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { AvatarDraft } from "../types/avatar";
import { DiceBearFields, diceBear } from "./dicebear-fields";
import { UserAvatar } from "./user-avatar";

/** The image types the upload rule accepts, so the picker offers nothing the API refuses. */
const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp";

/**
 * Presents the avatar chosen while creating a profile. The account that would own an
 * uploaded file does not exist yet, so a file stays local until the create request
 * carries it as one multipart part.
 */
export function AvatarDraftField({
  value,
  onChange,
  disabled = false,
  className,
}: {
  value: AvatarDraft;
  onChange: (value: AvatarDraft) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  // A picked image is previewed from an object URL, released once the choice moves on
  // so the file stops being held in memory.
  useEffect(() => () => { if (preview !== null) URL.revokeObjectURL(preview); }, [preview]);

  /** Applies one choice and keeps the local preview of a picked image beside it. */
  function choose(next: AvatarDraft): void {
    setPreview(next.type === "file" ? URL.createObjectURL(next.file) : null);
    onChange(next);
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Ảnh đại diện</CardTitle>
        <CardDescription>Chọn ảnh từ máy hoặc tạo ảnh DiceBear; ảnh được lưu cùng lúc tạo tài khoản.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex flex-wrap items-center gap-4">
          {preview !== null
            ? <Avatar size="lg"><AvatarImage src={preview} alt="Xem trước ảnh đại diện" className="object-cover" /><AvatarFallback delayMs={0}>?</AvatarFallback></Avatar>
            : <UserAvatar value={value.type === "dicebear" ? value : null} name="Ảnh đại diện" alt="Xem trước ảnh đại diện" size="lg" loading="eager" />}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Kiểu ảnh đại diện">
            <Button type="button" variant={value.type === "none" ? "default" : "outline"} disabled={disabled} onClick={() => choose({ type: "none" })}>Không dùng ảnh</Button>
            <Button type="button" variant={value.type === "dicebear" ? "default" : "outline"} disabled={disabled} onClick={() => choose(value.type === "dicebear" ? value : diceBear())}><Dices aria-hidden="true" />DiceBear</Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="avatar-file"><Upload aria-hidden="true" className="size-4" />Ảnh từ máy</Label>
          {/* Remounting on a type change clears a filename the choice no longer uses. */}
          <Input
            key={value.type}
            id="avatar-file"
            type="file"
            accept={ACCEPTED_IMAGES}
            disabled={disabled}
            onChange={(event) => {
              const picked = event.target.files?.[0];
              choose(picked ? { type: "file", file: picked } : { type: "none" });
            }}
          />
          <p className="text-xs text-muted-foreground">JPEG, PNG hoặc WebP, tối đa 25 MiB.</p>
        </div>

        {value.type === "dicebear" ? <DiceBearFields value={value} onChange={onChange} /> : null}
      </CardContent>
    </Card>
  );
}
