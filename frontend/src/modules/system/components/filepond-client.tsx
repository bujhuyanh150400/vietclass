"use client";

import { useEffect, useRef } from "react";
import { FilePond, registerPlugin } from "react-filepond";
import type { FilePondFile } from "filepond";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImageCrop from "filepond-plugin-image-crop";
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginImageResize from "filepond-plugin-image-resize";
import FilePondPluginImageTransform from "filepond-plugin-image-transform";

import "../styles/filepond.css";

registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize,
  FilePondPluginImageExifOrientation,
  FilePondPluginImageCrop,
  FilePondPluginImageResize,
  FilePondPluginImageTransform,
  FilePondPluginImagePreview,
);

const FILE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".csv",
  ".txt",
] as const;

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_FILE_SIZE = "26214400B";

/**
 * What a transformed avatar is called once it leaves FilePond.
 *
 * The transform hands back a bare `Blob`, which carries no name, and the upload rule
 * decides what a file is from its extension. So the name is assigned here rather than
 * left to whatever the person happened to call the photo on their phone — the bytes
 * are WebP by then regardless of what went in.
 */
const PREPARED_AVATAR_NAME = "avatar.webp";

/*
 * Sweeping the object URLs FilePond forgets.
 *
 * Whenever the image pipeline runs — which is what `mode="avatar"` turns on — FilePond
 * hands out one object URL per image that it never revokes, not on removing the file
 * and not on destroying the instance. Measured: a 2400×1600 photo leaves 3.3 MB of
 * decoded source reachable by nothing and freed by nothing, for the life of the
 * document. Five edits to an avatar is 16 MB. `mode="files"` does not run the pipeline
 * and does not leak, so none of this touches it.
 *
 * The sweep records every object URL handed out while an avatar pond actually holds an
 * image, and revokes whatever is left once it does not. That window is a second or two
 * of image loading on a screen whose only other pictures are data URIs, which is what
 * keeps a global patch this blunt from catching anything it should not. Revoking is
 * safe at that point by construction: the file is already gone from the pond.
 */
const trackedUrls = new Set<string>();
let loadsInFlight = 0;
let probeInstalled = false;

/** Wraps the object-URL factory once, so later calls can be attributed and swept. */
function installUrlProbe(): void {
  if (probeInstalled || typeof URL.createObjectURL !== "function") {
    return;
  }

  probeInstalled = true;
  const create = URL.createObjectURL.bind(URL);
  const revoke = URL.revokeObjectURL.bind(URL);

  URL.createObjectURL = (object: Blob | MediaSource): string => {
    const url = create(object);

    if (loadsInFlight > 0) {
      trackedUrls.add(url);
    }

    return url;
  };

  URL.revokeObjectURL = (url: string): void => {
    trackedUrls.delete(url);
    revoke(url);
  };
}

/** Starts attributing object URLs to an avatar pond that has just taken an image. */
function beginTracking(): void {
  installUrlProbe();
  loadsInFlight += 1;
}

/** Stops attributing, and releases what the last pond to finish left behind. */
function endTracking(): void {
  loadsInFlight = Math.max(0, loadsInFlight - 1);

  if (loadsInFlight > 0) {
    return;
  }

  for (const url of [...trackedUrls]) {
    URL.revokeObjectURL(url);
  }

  trackedUrls.clear();
}

/** Callbacks supplied by an upload owner so FilePond can report transfer state without owning an API. */
export type FilePondProcessHandlers = {
  load: (serverFileId: string) => void;
  error: (message: string) => void;
  progress: (loaded: number, total: number | undefined) => void;
  abort: () => void;
};

/** A consumer-owned transport adapter for a processed FilePond file. */
export type FilePondProcess = (
  file: File,
  handlers: FilePondProcessHandlers,
) => { abort?: () => void } | void;

/** Props shared by generic document and constrained avatar FilePond inputs. */
export type FilePondClientProps = {
  mode: "files" | "avatar";
  disabled?: boolean;
  labelIdle?: string;
  maxFiles?: number;
  process?: FilePondProcess;
  onFilesChange?: (files: File[]) => void;
  /**
   * Receives the image after the crop, resize and transform plugins have run, or
   * `null` once the picked file is removed.
   *
   * This is what a screen uses when there is nowhere to upload to yet. `onFilesChange`
   * reports the file as the person picked it — full size, whatever aspect ratio, EXIF
   * rotation unapplied — because the pipeline only runs when FilePond prepares output,
   * and without a `process` adapter nothing ever asks it to. Supplying this asks.
   */
  onPreparedFile?: (file: File | null) => void;
  /**
   * Bumped by the owner to drop whatever is loaded.
   *
   * It is a token rather than a ref because this component is reached through a
   * `dynamic()` boundary, and because the owner wants the files gone at a moment of
   * its choosing — before it hides this, not while React is tearing it down.
   */
  clearToken?: number;
  /**
   * An image to load in place of whatever is there, applied when `loadToken` changes.
   *
   * Replacing rather than reporting the result is what keeps the pond's preview honest
   * after an edit: the item, its preview and the transform all rerun on the new bytes,
   * so nothing downstream is still describing the picture the reader just changed.
   */
  loadFile?: File | null;
  loadToken?: number;
};

/** Browser-only FilePond instance with fixed application file and avatar constraints. */
export function FilePondClient({
  mode,
  disabled = false,
  labelIdle,
  maxFiles,
  process,
  onFilesChange,
  onPreparedFile,
  clearToken = 0,
  loadFile = null,
  loadToken = 0,
}: FilePondClientProps) {
  const avatar = mode === "avatar";
  const pond = useRef<FilePond | null>(null);
  // Whether this instance is currently the one whose object URLs are being watched.
  const tracking = useRef(false);

  /** Starts watching, at most once per loaded image. */
  function startTracking(): void {
    if (avatar && !tracking.current) {
      tracking.current = true;
      beginTracking();
    }
  }

  /** Stops watching and lets the sweep run, at most once per loaded image. */
  function stopTracking(): void {
    if (tracking.current) {
      tracking.current = false;
      endTracking();
    }
  }

  /*
   * Drop the loaded files on the owner's signal.
   *
   * FilePond revokes the object URL it built for an image when that image is removed,
   * but not when an instance still holding one is destroyed: the URL survives, and with
   * it the whole decoded source — measured at 3.3 MB for one 2400×1600 photo, held for
   * the life of the document. Removing on unmount does not help either, because the
   * release happens a tick later, by which time the instance is gone. So the owner
   * clears first and hides afterwards, and this instance is never torn down full.
   */
  useEffect(() => {
    if (clearToken > 0) {
      pond.current?.removeFiles();
    }
  }, [clearToken]);

  // Leaving the screen with an image still loaded is the other way FilePond's stray
  // URL escapes, so the sweep runs on unmount too.
  useEffect(() => () => stopTracking(), []);

  // Swap in an edited image. The removal is what releases the previous one, so it has
  // to land before the replacement is added rather than alongside it.
  useEffect(() => {
    const instance = pond.current;

    if (loadToken === 0 || instance === null || loadFile === null) {
      return;
    }

    instance.removeFiles();
    void instance.addFile(loadFile);
    // `loadFile` is carried by the token: a replacement is an event, and re-running
    // this because the same file arrived by a new render would add it twice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadToken]);

  /**
   * Runs the prepare pipeline and hands back the processed image.
   *
   * `prepareFiles()` is what triggers crop, resize and transform when no server is
   * configured; it resolves once the plugins have finished, so the blob it returns is
   * already square, scaled and re-encoded.
   */
  async function reportPreparedFile(): Promise<void> {
    const instance = pond.current;

    if (instance === null || onPreparedFile === undefined) {
      return;
    }

    if (instance.getFiles().length === 0) {
      onPreparedFile(null);

      return;
    }

    try {
      const [prepared] = await instance.prepareFiles();
      const output: unknown = prepared?.output;

      if (output instanceof Blob) {
        onPreparedFile(new File([output], PREPARED_AVATAR_NAME, { type: output.type }));
      }
    } catch {
      // A file the plugins refuse leaves the previous choice in place; FilePond has
      // already told the reader what is wrong with it in its own item row.
      onPreparedFile(null);
    }
  }

  return (
    <FilePond
      ref={pond}
      allowMultiple={!avatar}
      allowReorder={false}
      allowReplace={avatar}
      acceptedFileTypes={avatar ? [...AVATAR_TYPES] : [...FILE_EXTENSIONS]}
      allowProcess={process !== undefined}
      disabled={disabled}
      imageCropAspectRatio={avatar ? "1:1" : undefined}
      // FilePond's own avatar recipe: a round panel locked to the crop's 1:1, so the
      // pond previews the square the transform will actually produce instead of the
      // untouched source in its original aspect.
      imagePreviewHeight={avatar ? 152 : undefined}
      stylePanelLayout={avatar ? "compact circle" : undefined}
      stylePanelAspectRatio={avatar ? "1:1" : undefined}
      styleLoadIndicatorPosition={avatar ? "center bottom" : undefined}
      styleButtonRemoveItemPosition={avatar ? "center bottom" : undefined}
      imageResizeMode={avatar ? "cover" : undefined}
      imageResizeTargetHeight={avatar ? 512 : undefined}
      imageResizeTargetWidth={avatar ? 512 : undefined}
      imageTransformOutputMimeType={avatar ? "image/webp" : undefined}
      labelIdle={labelIdle}
      maxFileSize={MAX_FILE_SIZE}
      maxFiles={avatar ? 1 : (maxFiles ?? 30)}
      name="file"
      onaddfile={() => startTracking()}
      onupdatefiles={(items: FilePondFile[]) => {
        if (items.length === 0) {
          stopTracking();
        }

        onFilesChange?.(items.map((item) => item.file as File));
        void reportPreparedFile();
      }}
      server={
        process
          ? {
              process: (_fieldName, file, _metadata, load, error, progress, abort) => {
                const result = process(file as File, {
                  load,
                  error,
                  progress: (loaded, total) => progress(total !== undefined, loaded, total ?? 0),
                  abort,
                });

                return result?.abort ? { abort: result.abort } : undefined;
              },
            }
          : undefined
      }
    />
  );
}
