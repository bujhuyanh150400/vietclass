import assert from "node:assert/strict";
import test from "node:test";

import { getInstallGuidePlatform } from "./pwa-install-platform.ts";

test("classifies the install fallback without mistaking Android for iOS", () => {
  assert.equal(
    getInstallGuidePlatform(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Safari",
      0,
    ),
    "ios",
  );
  assert.equal(
    getInstallGuidePlatform(
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit Chrome",
      0,
    ),
    "android",
  );
  assert.equal(
    getInstallGuidePlatform(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit Chrome",
      0,
    ),
    "desktop",
  );
  assert.equal(
    getInstallGuidePlatform(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit",
      5,
    ),
    "ios",
  );
});
