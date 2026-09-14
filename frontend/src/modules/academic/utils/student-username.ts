import { foldVietnamese } from "@/lib/utils/index";

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
  const compact = foldVietnamese(fullName).replace(/[^a-z0-9]+/g, "");

  return compact === "" ? "" : `hs_${compact}`;
}
