import type { DiceBearAvatar } from "../types/avatar";

/**
 * Which of the two hair families a sample avatar is drawn from. The picker offers
 * this as Nam or Nữ, which is all the choice a teacher creating a profile wants to
 * make; everything else about the face is left to the seed.
 */
export type AvatarGender = "male" | "female";

/** Builds the `long01`/`short01` names Adventurer declares for one hair family. */
function hairVariants(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}${String(index + 1).padStart(2, "0")}`);
}

/**
 * The hair variants each gender draws from.
 *
 * Adventurer has no gender option, so the hair length carries the distinction: its
 * 26 long and 19 short variants are the only part of the style that reads as one or
 * the other. The lists mirror `api/config/avatar.php`, which is what actually
 * accepts or rejects the saved value.
 */
export const ADVENTURER_HAIR: Record<AvatarGender, readonly string[]> = {
  male: hairVariants("short", 19),
  female: hairVariants("long", 26),
};

/**
 * Returns a fresh seed. `crypto.randomUUID` is unavailable outside a secure context,
 * which the app is served from over plain HTTP, and an avatar seed carries no
 * security meaning anyway.
 */
function randomSeed(): string {
  return Math.random().toString(36).slice(2);
}

/**
 * Returns one random Adventurer avatar for the chosen gender.
 *
 * The seed is re-rolled along with the hair, so pressing random again visibly changes
 * the face rather than only its haircut.
 */
export function randomAdventurer(gender: AvatarGender): DiceBearAvatar {
  const variants = ADVENTURER_HAIR[gender];

  return {
    type: "dicebear",
    style: "adventurer",
    seed: randomSeed(),
    options: { hairVariant: variants[Math.floor(Math.random() * variants.length)] as string },
  };
}

/**
 * Reads back which gender a saved avatar was generated for, so reopening the picker
 * starts from the choice already on the profile.
 *
 * Anything that is not an Adventurer avatar with a long hair variant reads as male,
 * which is also the picker's starting point for an avatar saved before this style
 * existed.
 */
export function adventurerGender(value: DiceBearAvatar | null): AvatarGender {
  if (value === null || value.style !== "adventurer") {
    return "male";
  }

  const variant = value.options.hairVariant;

  return typeof variant === "string" && ADVENTURER_HAIR.female.includes(variant) ? "female" : "male";
}
