import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const worker = readFileSync(new URL("../../../../public/sw.js", import.meta.url), "utf8");
const fallback = readFileSync(new URL("../../../../public/offline.html", import.meta.url), "utf8");
const provider = readFileSync(new URL("./pwa-provider.tsx", import.meta.url), "utf8");

test("keeps the Service Worker cache limited to the static offline shell", () => {
  const listedAssets = [...worker.matchAll(/^  "([^"]+)",$/gm)].map((match) => match[1]);

  assert.deepEqual(listedAssets, [
    "/offline.html",
    "/app-icons/web/site.webmanifest",
    "/app-icons/web/icon-192.png",
    "/app-icons/web/icon-512.png",
    "/app-icons/web/icon-512-maskable.png",
    "/app-icons/web/apple-touch-icon.png",
    "/images/error.webp",
    "/images/brand-mark.png",
  ]);
  assert.match(worker, /const CACHE_PREFIX = "vietclasses-shell-"/);
  assert.match(worker, /const CACHE_NAME = `\$\{CACHE_PREFIX\}v\d+`/);
  assert.match(worker, /request\.mode !== "navigate"/);
  assert.match(
    worker,
    /async function getOfflineFallback\(\) \{[\s\S]*?caches\.open\(CACHE_NAME\)[\s\S]*?cache\.match\("\/offline\.html"\)/,
  );
  assert.match(worker, /key\.startsWith\(CACHE_PREFIX\) && key !== CACHE_NAME/);
  assert.doesNotMatch(worker, /cache\.put|caches\.match|\/api\//);
  assert.doesNotMatch(fallback, /_next\/|\/api\/|document\.cookie/);
});

test("registers the public worker after hydration only", () => {
  assert.match(provider, /navigator\.serviceWorker\.register\("\/sw\.js"\)/);
  assert.match(provider, /useEffect/);
  assert.doesNotMatch(provider, /fetch\(|axios|browserRequest/);
});
