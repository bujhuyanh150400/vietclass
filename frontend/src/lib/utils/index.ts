import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges conditional class names and resolves conflicting Tailwind utilities so
 * component variants and caller overrides produce one predictable class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { mapApiErrorToForm } from "./map-api-error-to-form";
export type { ApiFormErrorResult } from "./map-api-error-to-form";
