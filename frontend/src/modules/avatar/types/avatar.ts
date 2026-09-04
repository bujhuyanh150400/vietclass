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

/**
 * The avatar field a profile create endpoint accepts. A file has no id yet, so the
 * request only declares the choice and carries the image as a multipart part.
 */
export type AvatarCreateSelection =
  | { type: "none" }
  | DiceBearAvatar
  | { type: "file" };

/**
 * The avatar chosen while creating a profile. Its file is still a local upload,
 * because the account that will own the stored file does not exist yet.
 */
export type AvatarDraft =
  | { type: "none" }
  | DiceBearAvatar
  | { type: "file"; file: File };
