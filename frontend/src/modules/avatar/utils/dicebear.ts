import { Avatar, Style, type StyleOptions } from "@dicebear/core";
import adventurerDefinition from "@dicebear/styles/adventurer.json";

import type { DiceBearAvatar, DiceBearStyle } from "../types/avatar";

const STYLES: Record<DiceBearStyle, Style> = {
  adventurer: new Style(adventurerDefinition),
};

/**
 * Renders one persisted local definition as an image-safe data URI, or nothing when
 * it is invalid.
 *
 * A configuration naming a style this build does not carry lands in the catch and
 * renders as nothing, which `UserAvatar` shows as the person's initials.
 */
export function renderDiceBear(config: DiceBearAvatar): string | null {
  try {
    const options: StyleOptions = { seed: config.seed, ...config.options };
    return new Avatar(STYLES[config.style], options).toDataUri();
  } catch {
    return null;
  }
}
