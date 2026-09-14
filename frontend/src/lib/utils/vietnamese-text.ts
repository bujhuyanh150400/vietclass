/**
 * Folds a Vietnamese string to its unaccented lowercase form.
 *
 * Tone and vowel marks are split off by NFD and dropped; `đ` carries its stroke
 * inside the letter, so NFD leaves it whole and it is replaced by hand. Spaces are
 * kept — this is for comparing and matching text, not for building identifiers.
 *
 * It mirrors the `unaccent()` the API searches with, so a name the server would
 * consider a match is one the browser considers a match too.
 */
export function foldVietnamese(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/**
 * Folds a person's name into the form two spellings of the same name share.
 *
 * On top of dropping the marks it collapses runs of whitespace, because "Nguyễn  Văn
 * An" and "Nguyễn Văn An" are one person typed twice, and a duplicate check that
 * called them different people would be no check at all.
 */
export function foldedName(value: string): string {
  return foldVietnamese(value).trim().replace(/\s+/g, " ");
}

/**
 * Reduces a typed phone number to the digits that identify it.
 *
 * A number reaches a form written every way a person writes one: with spaces, with
 * dots, as `+84…` or `84…` for the same line that is stored as `0…`. Comparing the
 * raw strings would call those different numbers, so the country code is folded back
 * to the leading zero and everything that is not a digit is dropped.
 *
 * Returns a possibly-empty string; a caller deciding whether two numbers match should
 * require a plausible length rather than treating "" as a match for "".
 */
export function phoneDigits(value: string): string {
  return value.trim().replace(/^\+?84/, "0").replace(/\D/g, "");
}
