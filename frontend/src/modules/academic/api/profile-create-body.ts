import type { CreateProfileSubmission } from "../types/academic-requests";

/**
 * Returns the body one profile create request should be sent as.
 *
 * Only a `file` avatar needs multipart, and the API reads its JSON back out of the
 * `payload` part, so every other create keeps sending plain JSON.
 */
export function profileCreateBody<TPayload extends { avatar?: { type: string } }>(
  submission: CreateProfileSubmission<TPayload>,
): TPayload | FormData {
  if (submission.payload.avatar?.type !== "file") {
    return submission.payload;
  }

  if (submission.avatar_file === undefined) {
    throw new Error("Ảnh đại diện chưa có tệp upload.");
  }

  const body = new FormData();
  body.append("payload", JSON.stringify(submission.payload));
  body.append("avatar_file", submission.avatar_file);

  return body;
}
