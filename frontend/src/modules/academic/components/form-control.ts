/**
 * The shape a control takes inside a form sheet.
 *
 * The component library's defaults are 36px tall with a 6px radius, which is the
 * card-shaped form's proportion. A form sheet stands beside the list sheet's 44px
 * controls and the design system's 5px control radius, so every input, select and
 * date trigger inside one is restated at that size.
 *
 * They are constants rather than a restyled `Input` because the primitive is shared
 * with every screen that has not been redesigned yet — changing it there would move
 * five other forms nobody asked about.
 */

/**
 * A text input, select trigger, or date trigger: 44px tall on the design system's
 * radius.
 *
 * Two of these declarations are written the long way round because the primitives
 * set the same properties through selectors a plain utility cannot outrank — the
 * same trap `toolbar-control.ts` documents for `Button`:
 *
 * - `SelectTrigger` sets its height as `data-[size=default]:h-9`, which carries an
 *   attribute selector on top of its class and beats a bare `h-11`. Restating it
 *   through the same selector is the only way to reach 44px, and the select is 8px
 *   shorter than the inputs beside it otherwise.
 * - `Input` and `Textarea` set type as `text-base md:text-sm`. A bare `text-[13px]`
 *   has equal specificity and loses on source order, because Tailwind emits the
 *   responsive variant after the base utility — so the inputs read 14px while every
 *   select beside them reads 13px.
 */
export const SHEET_CONTROL =
  "h-11 data-[size=default]:h-11 rounded-control border-vc-control bg-card text-[13px] md:text-[13px]";

/** A textarea, which grows instead of standing at a fixed height. */
export const SHEET_TEXTAREA =
  "min-h-[88px] rounded-control border-vc-control bg-card text-[13px] md:text-[13px]";

/**
 * The label, hint, and error type scale inside a form sheet, applied once to a
 * section's field grid rather than to each of its dozen fields.
 */
export const SHEET_FIELD_TYPE = "[&_label]:text-xs [&_label]:font-medium [&_p]:text-[10px]";

/** A section's two-column field grid, stacking to one column on a phone. */
export const SHEET_FIELD_GRID = "grid gap-[18px_16px] sm:grid-cols-2";
