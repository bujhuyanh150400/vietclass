"use client";

import { Check, ZoomIn } from "lucide-react";
import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

/** The square the API stores an avatar at, and what the crop is rendered into. */
const OUTPUT_SIZE = 512;

/** What the cropped image is called and encoded as, matching the upload rule. */
const OUTPUT_NAME = "avatar.webp";
const OUTPUT_TYPE = "image/webp";

/**
 * Renders the chosen region of an image at the avatar's own size.
 *
 * The crop arrives in the source image's own pixels, so drawing it into a fixed
 * 512-square canvas both crops and scales in one step — no intermediate bitmap, and no
 * dependence on how large the picture was on screen.
 */
async function renderCrop(source: string, area: Area): Promise<Blob | null> {
  const image = new Image();
  image.src = source;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const context = canvas.getContext("2d");

  if (context === null) {
    return null;
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  return new Promise((resolve) => canvas.toBlob(resolve, OUTPUT_TYPE));
}

/**
 * Lets a reader choose which part of their photo becomes the avatar.
 *
 * The upload pipeline crops to the centre, which is right for most photos and wrong for
 * the ones where the face is not in the middle. This is the escape hatch: drag to pan,
 * pinch or drag the slider to zoom, inside the round mask the profile will actually be
 * shown in.
 *
 * It hands back a finished 512-square WebP rather than crop instructions, so the caller
 * can drop it straight into the pond in place of the original and let every preview
 * downstream agree with it.
 */
function AvatarCropper({
  source,
  onOpenChange,
  onCropped,
}: {
  source: string;
  onOpenChange: (open: boolean) => void;
  onCropped: (file: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  /** Renders the chosen region and hands it back, leaving the dialog closed after. */
  async function confirmCrop(): Promise<void> {
    if (area === null) {
      return;
    }

    setSaving(true);

    try {
      const blob = await renderCrop(source, area);

      if (blob !== null) {
        onCropped(new File([blob], OUTPUT_NAME, { type: blob.type }));
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Sửa ảnh đại diện</DialogTitle>
        <DialogDescription>
          Kéo để chọn vùng hiển thị, cuộn hoặc dùng thanh trượt để phóng to.
        </DialogDescription>
      </DialogHeader>

      <div className="relative h-[280px] w-full overflow-hidden rounded-panel bg-vc-ink">
        {source === null ? null : (
          <Cropper
            image={source}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_area, pixels) => setArea(pixels)}
          />
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="avatar-zoom" className="text-xs">
          <ZoomIn aria-hidden="true" className="size-4" />
          Phóng to
        </Label>
        <input
          id="avatar-zoom"
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          aria-label="Phóng to ảnh"
          className="w-full accent-vc-orange"
          onChange={(event) => setZoom(Number(event.target.value))}
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
        >
          Hủy
        </Button>
        <Button
          type="button"
          disabled={saving || area === null}
          onClick={() => void confirmCrop()}
        >
          <Check aria-hidden="true" />
          {saving ? "Đang cắt…" : "Dùng vùng này"}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Hosts the cropper, mounting it only while the dialog is open.
 *
 * Mounting is what gives the editor its source and its starting pan and zoom, and
 * unmounting is what releases them — so opening the dialog twice never resumes a crop
 * the reader had abandoned.
 */
export function AvatarCropDialog({
  source,
  onOpenChange,
  onCropped,
}: {
  /**
   * The picture to edit, as an object URL the caller owns.
   *
   * The caller builds it when opening and releases it when closing, rather than this
   * doing it on mount: an effect that both creates and revokes a URL is undone by
   * React's development double-invoke, and one that only revokes leaks on every open.
   * An open and a close are events, and events are where a resource like this belongs.
   */
  source: string | null;
  onOpenChange: (open: boolean) => void;
  onCropped: (file: File) => void;
}) {
  return (
    <Dialog open={source !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {source === null ? null : (
          <AvatarCropper source={source} onOpenChange={onOpenChange} onCropped={onCropped} />
        )}
      </DialogContent>
    </Dialog>
  );
}
