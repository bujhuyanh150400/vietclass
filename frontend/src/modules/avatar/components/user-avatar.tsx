"use client";

import { useMemo, useState, type ComponentProps } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fileContentUrl } from "@/modules/files";

import type { AvatarValue } from "../types/avatar";
import { renderDiceBear } from "../utils/dicebear";

/** Derives a stable visible fallback from a display name. */
function initials(name: string): string {
  return (Array.from(name.trim())[0] ?? "?").toUpperCase();
}

/** Resolves only the API content route or local renderer output into an image source. */
function avatarSource(value: AvatarValue): string | null {
  if (value?.type === "file") return fileContentUrl(value.file_id);
  return value?.type === "dicebear" ? renderDiceBear(value) : null;
}

/** Renders a file, local DiceBear, or initials avatar with an image-error fallback. */
export function UserAvatar({
  value,
  name,
  alt,
  loading = "lazy",
  ...props
}: Omit<ComponentProps<typeof Avatar>, "children"> & {
  value: AvatarValue;
  name: string;
  alt: string;
  loading?: ComponentProps<"img">["loading"];
}) {
  const source = useMemo(() => avatarSource(value), [value]);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const failed = failedSource === source;

  return (
    <Avatar {...props}>
      {source !== null && !failed ? <AvatarImage src={source} alt={alt} loading={loading} onError={() => setFailedSource(source)} /> : null}
      <AvatarFallback delayMs={0}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
