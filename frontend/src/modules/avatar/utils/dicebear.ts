import { Avatar, Style, type StyleOptions } from "@dicebear/core";
import loreleiDefinition from "@dicebear/styles/lorelei.json";
import notionistsDefinition from "@dicebear/styles/notionists.json";
import thumbsDefinition from "@dicebear/styles/thumbs.json";

import type { DiceBearAvatar, DiceBearStyle } from "../types/avatar";

const STYLES: Record<DiceBearStyle, Style> = {
  lorelei: new Style(loreleiDefinition),
  notionists: new Style(notionistsDefinition),
  thumbs: new Style(thumbsDefinition),
};

/** Renders one persisted local definition as an image-safe data URI, or nothing when it is invalid. */
export function renderDiceBear(config: DiceBearAvatar): string | null {
  try {
    const options: StyleOptions = { seed: config.seed, ...config.options };
    return new Avatar(STYLES[config.style], options).toDataUri();
  } catch {
    return null;
  }
}
