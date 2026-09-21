import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const worker = readFileSync(new URL("../../../../public/sw.js", import.meta.url), "utf8");
const fallback = readFileSync(new URL("../../../../public/offline.html", import.meta.url), "utf8");

test("keeps the Service Worker cache limited to the static offline shell", () => {
  assert.match(worker, /const CACHE_PREFIX = "vietclasses-shell-"/);
  assert.match(worker, /request\.mode !== "navigate"/);
  assert.match(worker, /caches\.match\("\/offline\.html"\)/);
  assert.doesNotMatch(worker, /cache\.put|caches\.match\(event\.request\)|\/api\//);
  assert.doesNotMatch(fallback, /_next\/|\/api\/|document\.cookie/);
});
