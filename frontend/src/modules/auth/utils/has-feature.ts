/** Answers whether a resolved feature collection grants one presentation capability. */
export function hasFeature(
  features: readonly string[] | undefined,
  feature: string,
): boolean {
  return features?.includes(feature) ?? false;
}
