type JsonObject = Record<string, unknown>;

type LoginSession = {
  token: string;
  expiresAt: string;
  body: JsonObject;
};

/** Builds the server-to-server headers without trusting browser-supplied auth. */
export function createUpstreamHeaders(request: Request, token: string | null): Headers {
  const requestedAccept = request.headers.get("accept");
  const headers = new Headers({
    Accept:
      requestedAccept === null || requestedAccept === "*/*"
        ? "application/json"
        : requestedAccept,
  });
  const contentType = request.headers.get("content-type");

  if (contentType !== null) {
    headers.set("Content-Type", contentType);
  }

  if (token !== null) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

/** Removes the bearer token from a successful login response before it reaches the browser. */
export function sanitizeLoginPayload(payload: unknown): LoginSession | null {
  if (!isJsonObject(payload) || !isJsonObject(payload.data)) {
    return null;
  }

  const token = payload.data.token;
  const expiresAt = payload.data.expires_at;

  if (typeof token !== "string" || token === "" || typeof expiresAt !== "string") {
    return null;
  }

  const safeData = { ...payload.data };
  delete safeData.token;
  delete safeData.token_type;

  const safePayload = { ...payload };
  delete safePayload.token;
  delete safePayload.token_type;
  safePayload.data = safeData;

  return {
    token,
    expiresAt,
    body: safePayload,
  };
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
