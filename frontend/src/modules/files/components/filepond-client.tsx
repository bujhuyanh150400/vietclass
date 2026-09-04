"use client";

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
  process?: FilePondProcess;
  onFilesChange?: (files: File[]) => void;
};

/** Browser-only FilePond instance with fixed application file and avatar constraints. */
export function FilePondClient({
  mode,
  disabled = false,
  labelIdle,
  process,
  onFilesChange,
}: FilePondClientProps) {
  const avatar = mode === "avatar";

  return (
    <FilePond
      allowMultiple={!avatar}
      allowReorder={false}
      allowReplace={avatar}
      acceptedFileTypes={avatar ? [...AVATAR_TYPES] : [...FILE_EXTENSIONS]}
      allowProcess={process !== undefined}
      disabled={disabled}
      imageCropAspectRatio={avatar ? "1:1" : undefined}
      imageResizeMode={avatar ? "cover" : undefined}
      imageResizeTargetHeight={avatar ? 512 : undefined}
      imageResizeTargetWidth={avatar ? 512 : undefined}
      imageTransformOutputMimeType={avatar ? "image/webp" : undefined}
      labelIdle={labelIdle}
      maxFileSize={MAX_FILE_SIZE}
      maxFiles={avatar ? 1 : 30}
      name="file"
      onupdatefiles={(items: FilePondFile[]) => {
        onFilesChange?.(items.map((item) => item.file as File));
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
