/**
 * Suggests a login name from a student's full name.
 *
 * The API requires lowercase letters, digits and underscores, which a Vietnamese
 * name never is: it carries tone marks and spaces. Stripping the marks and the
 * spaces by hand is the busywork this removes — the suggestion is a starting point
 * the reader can still edit, not a value the form imposes.
 *
 * Returns an empty string when there is no name to build one from, so the caller
 * can ask for the name first instead of offering `hs_`.
 */
export function suggestStudentUsername(fullName: string): string {
  const compact = fullName
    .normalize("NFD")
    // Combining tone and vowel marks, which NFD has just split off each letter.
    .replace(/[̀-ͯ]/g, "")
    // Đ and đ carry their stroke inside the letter, so NFD leaves them whole.
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  return compact === "" ? "" : `hs_${compact}`;
}
