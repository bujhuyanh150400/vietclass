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

type UserAvatarValueProp =
  | { value: AvatarValue; avatar?: never }
  | { avatar: AvatarValue; value?: never };

/** Renders a file, local DiceBear, or initials avatar with an image-error fallback. */
export function UserAvatar({
  value,
  avatar,
  name,
  alt,
  loading = "lazy",
  ...props
}: Omit<ComponentProps<typeof Avatar>, "children"> & UserAvatarValueProp & {
  value: AvatarValue;
  name: string;
  alt: string;
  loading?: ComponentProps<"img">["loading"];
}) {
  const avatarValue: AvatarValue = value === undefined ? avatar ?? null : value;
  const source = useMemo(() => avatarSource(avatarValue), [avatarValue]);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const failed = failedSource === source;

  return (
    <Avatar {...props}>
      {source !== null && !failed ? <AvatarImage src={source} alt={alt} loading={loading} onError={() => setFailedSource(source)} /> : null}
      <AvatarFallback delayMs={0}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
