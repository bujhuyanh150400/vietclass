/**
 * Derives the monogram shown wherever a person has no picture.
 *
 * Vietnamese names put the family name first and the given name last, and the
 * given name is what someone is actually called by — so the letters come from
 * the last two words: "Nguyễn Minh Anh" reads as "MA", not "NM". A single-word
 * name yields one letter, and a name with nothing to read yields "?" rather
 * than an empty circle.
 *
 * The name is composed to NFC first so a decomposed vowel keeps its diacritic:
 * without it, "Đăng" written as `a` + a combining breve would render as a bare
 * "A". Marks are composed, never stripped.
 */
export function personInitials(name: string): string {
  const words = name.normalize("NFC").trim().split(/\s+/).filter(Boolean);

  const monogram = words
    .slice(-2)
    .map((word) => [...word][0] ?? "")
    .join("");

  return monogram === "" ? "?" : monogram.toUpperCase();
}
