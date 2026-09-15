import { z } from "zod";

import type { DiceBearOptionValue, DiceBearOptions, DiceBearStyle } from "../types/avatar";

const styles = ["adventurer"] as const;
const flipValues = ["none", "horizontal", "vertical", "both"] as const;
const fillValues = ["solid", "linear", "radial"] as const;
const orderValues = ["random", "fixed"] as const;

type StyleRules = { components: readonly string[]; colors: readonly string[]; variants: Record<string, readonly string[]> };

/** Builds the `variantNN` names one Adventurer component declares. */
function numbered(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `variant${String(index + 1).padStart(2, "0")}`);
}

/** Builds the `long01`/`short01` hair names Adventurer declares, in definition order. */
function adventurerHair(): string[] {
  return [
    ...Array.from({ length: 26 }, (_, index) => `long${String(index + 1).padStart(2, "0")}`),
    ...Array.from({ length: 19 }, (_, index) => `short${String(index + 1).padStart(2, "0")}`),
  ];
}

const STYLE_RULES: Record<DiceBearStyle, StyleRules> = {
  adventurer: {
    components: ["details", "earrings", "eyebrows", "eyes", "glasses", "hair", "head", "mouth"],
    colors: ["earrings", "eyes", "glasses", "hair", "ink", "lips", "sclera", "skin", "teeth", "throat", "tongue", "uvula"],
    variants: {
      details: ["birthmark", "blush", "freckles", "mustache"],
      earrings: numbered(6),
      eyebrows: numbered(15),
      eyes: numbered(26),
      glasses: numbered(5),
      hair: adventurerHair(),
      head: ["default"],
      mouth: numbered(30),
    },
  },
};

const scalarSchema = z.union([z.string(), z.number(), z.boolean()]);
const optionsSchema = z.record(z.string(), scalarSchema);
const hexColor = /^#?[0-9a-fA-F]{3,8}$/;

/** Checks a scalar option is an integer inside a backend-declared range. */
function isIntegerBetween(value: DiceBearOptionValue, min: number, max: number): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

/** Returns whether one scalar option is inside the exact backend style contract. */
function isAllowedOption(style: DiceBearStyle, key: string, value: DiceBearOptionValue): boolean {
  if (key === "backgroundColor") return typeof value === "string" && hexColor.test(value);
  if (key === "flip") return typeof value === "string" && flipValues.includes(value as (typeof flipValues)[number]);
  if (key === "scale") return isIntegerBetween(value, 0, 10);
  if (key === "rotate") return isIntegerBetween(value, -360, 360);
  if (key === "translateX" || key === "translateY") return isIntegerBetween(value, -1000, 1000);
  if (key === "borderRadius") return isIntegerBetween(value, 0, 50);

  const rules = STYLE_RULES[style];
  for (const component of rules.components) {
    if (key === `${component}Probability`) return isIntegerBetween(value, 0, 100);
    if (key === `${component}Variant`) return typeof value === "string" && rules.variants[component]?.includes(value);
  }
  for (const color of rules.colors) {
    if (key === `${color}Color`) return typeof value === "string" && hexColor.test(value);
    if (key === `${color}ColorFill`) return typeof value === "string" && fillValues.includes(value as (typeof fillValues)[number]);
    if (key === `${color}ColorFillStops`) return isIntegerBetween(value, 2, 128);
    if (key === `${color}ColorAngle`) return isIntegerBetween(value, -360, 360);
    if (key === `${color}ColorOrder`) return typeof value === "string" && orderValues.includes(value as (typeof orderValues)[number]);
  }

  return false;
}

/** Applies the backend's 16 KiB JSON and per-style option constraints to a DiceBear draft. */
function validateDiceBear(value: { style: DiceBearStyle; options: DiceBearOptions }, context: z.RefinementCtx): void {
  const bytes = new TextEncoder().encode(JSON.stringify(value)).byteLength;
  if (bytes > 16 * 1024) context.addIssue({ code: "custom", message: "Cấu hình ảnh đại diện vượt quá 16 KiB." });
  for (const [key, option] of Object.entries(value.options)) {
    if (!isAllowedOption(value.style, key, option)) context.addIssue({ code: "custom", path: ["options", key], message: "Tùy chọn DiceBear không hợp lệ." });
  }
}

const diceBearSchema = z.object({
  type: z.literal("dicebear"),
  style: z.enum(styles),
  seed: z.string().min(1).max(128),
  options: optionsSchema,
}).strict().superRefine(validateDiceBear);

/** Validates the full profile avatar value returned by the API. */
export const avatarValueSchema = z.union([
  z.null(),
  z.object({ type: z.literal("file"), file_id: z.number().int().positive(), content_url: z.string().min(1) }).strict(),
  diceBearSchema,
]);

/** Validates the direct avatar JSON union accepted by the profile endpoint. */
export const avatarSelectionSchema = z.union([
  z.object({ type: z.literal("none") }).strict(),
  z.object({ type: z.literal("file"), file_id: z.number().int().positive() }).strict(),
  diceBearSchema,
]);
