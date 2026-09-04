/** The three local DiceBear definition files accepted by the API. */
export type DiceBearStyle = "lorelei" | "notionists" | "thumbs";

/** Scalar values permitted inside a server-validated DiceBear option object. */
export type DiceBearOptionValue = string | number | boolean;

/** The closed, scalar-only option surface persisted for a local DiceBear avatar. */
export type DiceBearOptions = Record<string, DiceBearOptionValue>;

/** One local DiceBear avatar configuration persisted by the API. */
export type DiceBearAvatar = {
  type: "dicebear";
  style: DiceBearStyle;
  seed: string;
  options: DiceBearOptions;
};

/** The nullable avatar union returned by profile-bearing API resources. */
export type AvatarValue =
  | null
  | { type: "file"; file_id: number; content_url: string }
  | DiceBearAvatar;

/** The direct JSON union accepted by PUT /profiles/{profile}/avatar. */
export type AvatarSelection =
  | { type: "none" }
  | { type: "file"; file_id: number }
  | DiceBearAvatar;
