/**
 * The shape a Filter, Sort, or View trigger takes inside a list sheet's toolbar.
 *
 * The default triggers are 32px chips that trail a table's own card. A sheet
 * prints its toolbar along the top edge instead, where the controls stand beside
 * a full-width search box and read as part of the sheet — so they match the
 * search box's 44px height and keep the design system's 5px control radius.
 *
 * Below `xl` the row has to give its width back to the table beneath it, so each
 * trigger drops its label and becomes a 44px square with its count tucked into
 * the corner. The three constants are shared rather than repeated because the
 * three triggers have to shed their labels at the same width; a control that
 * kept its label while its neighbours lost theirs would look misaligned.
 */

/**
 * Trigger geometry: 44px tall, square and label-less below `xl`.
 *
 * The horizontal padding is written as `has-[>svg]:px-3` because every trigger
 * holds an icon and the Button variant narrows icon-bearing buttons through that
 * same selector — a plain `px-3` would carry lower specificity and lose silently.
 */
export const COMPACT_TRIGGER =
  "relative h-11 gap-2 rounded-control border-vc-control has-[>svg]:px-3 max-xl:w-11 max-xl:justify-center max-xl:has-[>svg]:px-0";

/** The trigger's text, hidden once the row goes narrow. */
export const COMPACT_LABEL = "max-xl:hidden";

/** The count bubble, moved to the corner once the label is gone. */
export const COMPACT_BADGE = "max-xl:absolute max-xl:-top-1 max-xl:-right-1";
