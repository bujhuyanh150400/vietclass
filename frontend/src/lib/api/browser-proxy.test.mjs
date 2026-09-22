import assert from "node:assert/strict";
import test from "node:test";

import {
  createUpstreamHeaders,
  sanitizeLoginPayload,
} from "./browser-proxy.ts";

test("creates an upstream bearer request without forwarding browser credentials", () => {
  const request = new Request("http://localhost:3000/api/v1/academic/students", {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer attacker-controlled",
      Cookie: "vietclass_browser_token=browser-cookie",
      "Content-Type": "application/json",
    },
  });

  const headers = createUpstreamHeaders(request, "server-side-token");

  assert.equal(headers.get("Accept"), "application/json");
  assert.equal(headers.get("Authorization"), "Bearer server-side-token");
  assert.equal(headers.get("Cookie"), null);
  assert.equal(headers.get("Content-Type"), "application/json");

  const defaultHeaders = createUpstreamHeaders(
    new Request("http://localhost:3000/api/v1/auth/me", {
      headers: { Accept: "*/*" },
    }),
    null,
  );

  assert.equal(defaultHeaders.get("Accept"), "application/json");
});

test("removes the bearer token before returning the login payload to the browser", () => {
  const result = sanitizeLoginPayload({
    token: "1|secret-token",
    token_type: "Bearer",
    data: {
      token: "1|secret-token",
      token_type: "Bearer",
      expires_at: "2026-10-22T07:00:00.000Z",
      user: { id: 1 },
    },
  });

  assert.deepEqual(result, {
    token: "1|secret-token",
    expiresAt: "2026-10-22T07:00:00.000Z",
    body: {
      data: {
        expires_at: "2026-10-22T07:00:00.000Z",
        user: { id: 1 },
      },
    },
  });

  assert.equal("token" in result.body, false);
  assert.equal("token_type" in result.body, false);
  assert.equal("token" in result.body.data, false);
  assert.equal("token_type" in result.body.data, false);
});
