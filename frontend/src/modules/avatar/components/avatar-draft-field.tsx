"use client";

import { Crop } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/index";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilePondInput } from "@/modules/files";

import type { AvatarDraft, AvatarValue, DiceBearAvatar } from "../types/avatar";
import { randomAdventurer } from "../utils/adventurer";
import { AvatarCropDialog } from "./avatar-crop-dialog";
import { SampleAvatarPicker } from "./sample-avatar-picker";
import { UserAvatar } from "./user-avatar";

const UPLOAD_LABEL = 'Kéo ảnh vào<br>hoặc <span class="filepond--label-action">chọn</span>';

const UPLOAD_HINT = "JPEG, PNG hoặc WebP • Ảnh được cắt vuông và thu về 512×512";

/** Which of the two ways of getting an avatar the block is currently showing. */
type AvatarSource = "upload" | "sample";

/**
 * Presents the avatar chosen while creating a profile.
 *
 * The account that would own an uploaded file does not exist yet, so there is nowhere
 * to upload to: the file stays local until the create request carries it as one
 * multipart part. FilePond still does the work it does everywhere else — it runs
 * without a server and hands back the cropped, resized, re-encoded image — so a photo
 * picked here reaches the API already square, 512px and WebP, rather than as a
 * 24-megapixel portrait the browser then squashes into a circle.
 *
 * The two sources take turns in one frame rather than sitting side by side: an upload
 * and a generated face are alternatives, and showing both at once means two pictures
 * of an avatar that can only be one of them.
 *
 * `bare` drops the surrounding card, for a screen that heads the block itself — the
 * same escape hatch `FormShell` offers a form that groups its own fields.
 *
 * `allowUpload` is off for a profile with no account behind it: the library stores an
 * image against its owner, so there is nobody to own one. The toggle then has a single
 * choice and is not drawn, rather than offering a tab that only reports a refusal once
 * the reader has already picked a photo.
 *
 * `current` is the picture a profile already has, and the frame rests on it until the
 * reader replaces it. A stored file cannot be rebuilt into a draft — it is an id, not
 * an upload and not a generated face — so without this an edit screen would open on
 * initials and imply the photo on file had gone. It is left unset wherever an empty
 * draft means "remove the picture", which is a staged change and not a starting point.
 */
export function AvatarDraftField({
  value,
  onChange,
  current = null,
  name = "Ảnh đại diện",
  disabled = false,
  allowUpload = true,
  bare = false,
  className,
}: {
  value: AvatarDraft;
  onChange: (value: AvatarDraft) => void;
  /** The avatar already stored on the profile, shown until the draft replaces it. */
  current?: AvatarValue;
  /** Whose avatar this is, for the initials shown while no picture is chosen. */
  name?: string;
  disabled?: boolean;
  allowUpload?: boolean;
  bare?: boolean;
  className?: string;
}) {
  const [chosenSource, setSource] = useState<AvatarSource>(
    value.type === "file" ? "upload" : "sample",
  );
  // With no upload tab there is only ever one source, whatever was chosen before.
  const source: AvatarSource = allowUpload ? chosenSource : "sample";

  // The last generated face, so returning to the sample tab restores the one that was
  // showing instead of rolling a stranger. A DiceBear value is four small fields; it is
  // the uploaded image, not this, that must not be left lying around.
  const lastSample = useRef<DiceBearAvatar | null>(value.type === "dicebear" ? value : null);
  // A face to offer the picker before the reader has generated one. Lazy state rather
  // than a ref because the render reads it, and rolled once per mount so it does not
  // change under the reader between renders.
  const [fallbackSample] = useState<DiceBearAvatar>(() => randomAdventurer("male"));
  // Bumped to make FilePond drop its file. See `chooseSource` for why the pond is
  // cleared rather than unmounted.
  const [clearToken, setClearToken] = useState(0);
  // The picture as the reader chose it, kept so the editor can re-crop from the full
  // original rather than from the square the pipeline already cut out of it.
  const [original, setOriginal] = useState<File | null>(null);
  // The original as an object URL, alive only while the editor is open. Built and
  // released in these handlers rather than inside the dialog, so the resource has one
  // owner and its lifetime is two events rather than a mount and an unmount.
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [replacement, setReplacement] = useState<{ file: File; token: number } | null>(null);

  /**
   * Takes the processed image FilePond hands back, or clears it once removed.
   *
   * No preview is built here. FilePond draws the picked image inside its own round
   * panel, which is the frame on screen, so a second object URL would be one this
   * component then had to remember to release.
   */
  function usePreparedFile(file: File | null): void {
    onChange(file === null ? { type: "none" } : { type: "file", file });
  }

  /**
   * Puts the edited image back through the pond.
   *
   * It is not applied to the draft directly: letting the pond reload it keeps the
   * preview, the file item and the transform all describing the same picture, which is
   * the same reason Filament's own editor replaces the file rather than reporting past
   * it.
   */
  function useCroppedFile(file: File): void {
    setReplacement((previous) => ({ file, token: (previous?.token ?? 0) + 1 }));
  }

  /** Opens the editor on the picture as it was chosen, before any cropping. */
  function openCropEditor(): void {
    if (original !== null) {
      setCropSource(URL.createObjectURL(original));
    }
  }

  /** Closes the editor and releases the picture it was holding. */
  function closeCropEditor(): void {
    setCropSource((openUrl) => {
      if (openUrl !== null) {
        URL.revokeObjectURL(openUrl);
      }

      return null;
    });
  }

  /**
   * Moves between the two sources, dropping what the source being left had produced.
   *
   * Leaving the upload tab drops the `File` from the draft and tells FilePond to
   * release the image it loaded. The pond is hidden rather than unmounted, because
   * destroying it while a file is still in it strands the object URL FilePond built
   * for that image — 3.3 MB of decoded PNG that nothing can reach and nothing frees.
   * Clearing first, with the instance alive to finish the release, is what actually
   * gets the memory back.
   */
  function chooseSource(next: AvatarSource): void {
    if (next === source) {
      return;
    }

    setSource(next);

    if (next === "upload") {
      if (value.type === "dicebear") {
        lastSample.current = value;
      }

      onChange({ type: "none" });

      return;
    }

    setClearToken((token) => token + 1);
    const sample = lastSample.current ?? fallbackSample;
    lastSample.current = sample;
    onChange(sample);
  }

  /** Records and applies a freshly generated face. */
  function chooseSample(sample: DiceBearAvatar): void {
    lastSample.current = sample;
    onChange(sample);
  }

  const editor = (
    <div className="grid justify-items-center gap-0 text-center">
      {/* One frame, always the same size, whichever source is filling it. In upload
          mode FilePond's own round panel is that frame — it previews the 1:1 crop the
          transform will produce, so what is on screen is what gets saved. */}
      {!allowUpload ? null : (
        <div className={cn("w-[152px]", source === "upload" ? null : "hidden")}>
          <FilePondInput
            mode="avatar"
            disabled={disabled}
            labelIdle={UPLOAD_LABEL}
            clearToken={clearToken}
            loadFile={replacement?.file ?? null}
            loadToken={replacement?.token ?? 0}
            onFilesChange={(files) => setOriginal(files[0] ?? null)}
            onPreparedFile={usePreparedFile}
          />
        </div>
      )}


      {source === "upload" ? null : (
        <div className="relative grid size-[152px] place-items-center rounded-full border border-vc-control bg-card shadow-[0_4px_0_var(--vc-shell-rule)]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-2.5 rounded-full border border-dashed border-vc-rule"
          />
          <UserAvatar
            value={value.type === "dicebear" ? value : current}
            name={name}
            alt={value.type === "dicebear" ? "Ảnh đại diện đã chọn cho hồ sơ" : "Ảnh đại diện đang dùng"}
            className="absolute inset-2 size-auto"
            loading="eager"
          />
        </div>
      )}

      {!allowUpload ? null : (
      <Tabs
        value={source}
        className="mt-5 w-full max-w-[260px]"
        onValueChange={(next) => chooseSource(next as AvatarSource)}
      >

        <TabsList className="grid h-auto w-full grid-cols-2 rounded-control border border-vc-control bg-card p-[3px] group-data-[orientation=horizontal]/tabs:h-auto">
          <TabsTrigger
            value="upload"
            disabled={disabled}
            className="min-h-10 rounded-[3px] text-[11px] font-medium data-[state=active]:bg-vc-ink data-[state=active]:text-vc-paper data-[state=active]:shadow-none"
          >
            Tải ảnh lên
          </TabsTrigger>
          <TabsTrigger
            value="sample"
            disabled={disabled}
            className="min-h-10 rounded-[3px] text-[11px] font-medium data-[state=active]:bg-vc-ink data-[state=active]:text-vc-paper data-[state=active]:shadow-none"
          >
            Avatar mẫu
          </TabsTrigger>
        </TabsList>
      </Tabs>
      )}

      <div className={cn("w-full max-w-[260px]", allowUpload ? "mt-3.5" : "mt-5")}>

        {source === "upload" ? (
          <div className="grid justify-items-center gap-2.5">
            {original === null ? null : (
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                className="h-11 w-full rounded-control border-vc-control text-[11px]"
                onClick={openCropEditor}
              >
                <Crop aria-hidden="true" className="size-4" />
                Sửa ảnh
              </Button>
            )}
            <p className="text-[10px] leading-[1.6] text-muted-foreground">{UPLOAD_HINT}</p>
          </div>
        ) : (
          <SampleAvatarPicker
            value={value.type === "dicebear" ? value : fallbackSample}
            onChange={chooseSample}
            disabled={disabled}
          />
        )}
      </div>

      <AvatarCropDialog
        source={cropSource}
        onOpenChange={(open) => { if (!open) { closeCropEditor(); } }}
        onCropped={useCroppedFile}
      />
    </div>
  );

  if (bare) {
    return <div className={className}>{editor}</div>;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Ảnh đại diện</CardTitle>
        <CardDescription>
          Tải ảnh từ máy hoặc chọn một avatar mẫu; ảnh được lưu cùng lúc tạo tài khoản.
        </CardDescription>
      </CardHeader>
      <CardContent>{editor}</CardContent>
    </Card>
  );
}
