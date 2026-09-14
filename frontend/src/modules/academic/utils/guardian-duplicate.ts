import { foldedName, phoneDigits } from "@/lib/utils/index";

import type { GuardianDraft } from "../schemas/academic-form-schema";
import type { GuardianOption } from "../types/academic";

/**
 * Why a typed-in guardian looks like somebody who already exists.
 *
 * The three are genuinely different situations, not three shades of one warning, so
 * each gets its own way out:
 *
 * - `linked` — they are already on this student's roster. There is nothing to add and
 *   nothing to decide; the row to edit is a few pixels away.
 * - `phone` — the number belongs to somebody else on file. A phone number identifies a
 *   person more reliably than a Vietnamese name does, so this is the strong signal: it
 *   is very likely the same human being, or a typo.
 * - `name` — only the name matches. Vietnamese names collide constantly, so this is a
 *   remark rather than an objection, and creating a second person stays a normal thing
 *   to do.
 */
export type GuardianDuplicateReason = "linked" | "phone" | "name";

/** Who the typed-in guardian appears to be, and how sure we are. */
export type GuardianDuplicate = {
  reason: GuardianDuplicateReason;
  /** The profile matched, or null when the clash is with an unsaved roster row. */
  profile_id: number | null;
  name: string;
  phone: string | null;
};

/** How many digits a number needs before it is worth matching anybody against. */
const MATCHABLE_DIGITS = 9;

/**
 * Decides whether a typed-in guardian is somebody who already exists.
 *
 * Checked against the roster first, because a clash there is the one the reader can
 * see on screen and the one no lookup is needed for. Then by phone, then by name —
 * strongest signal first, so the warning a reader is shown is the most specific one
 * that is true rather than whichever check happened to run first.
 *
 * `candidates` is whatever the directory returned for the typed term; the exact match
 * is found here rather than trusted from the server, because that endpoint searches
 * loosely on purpose — it offers people to pick from, while this decides whether two
 * records are one person.
 */
export function findGuardianDuplicate({
  name,
  phone,
  roster,
  candidates,
}: {
  name: string;
  phone: string;
  roster: GuardianDraft[];
  candidates: GuardianOption[];
}): GuardianDuplicate | null {
  const key = foldedName(name);
  const digits = phoneDigits(phone);

  const onRoster = roster.find((draft) => foldedName(draft.name) === key);

  if (onRoster !== undefined) {
    return {
      reason: "linked",
      profile_id: onRoster.profile_id,
      name: onRoster.name,
      phone: onRoster.phone === "" ? null : onRoster.phone,
    };
  }

  const byPhone =
    digits.length >= MATCHABLE_DIGITS
      ? candidates.find((option) => option.phone !== null && phoneDigits(option.phone) === digits)
      : undefined;

  const match = byPhone ?? candidates.find((option) => foldedName(option.label) === key);

  if (match === undefined) {
    return null;
  }

  // Somebody already on the roster, reached by a different spelling of their name.
  // That is the `linked` situation, whichever check found them.
  const alreadyLinked = roster.some((draft) => draft.profile_id === match.id);

  return {
    reason: alreadyLinked ? "linked" : byPhone === undefined ? "name" : "phone",
    profile_id: match.id,
    name: match.label,
    phone: match.phone,
  };
}
