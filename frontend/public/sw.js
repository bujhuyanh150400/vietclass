const CACHE_PREFIX = "vietclasses-shell-";
// ponytail: bump the shell version when fallback assets change; generated shell cleanup is intentionally global per app origin.
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const SHELL_ASSETS = [
  "/offline.html",
  "/app-icons/web/site.webmanifest",
  "/app-icons/web/icon-192.png",
  "/app-icons/web/icon-512.png",
  "/app-icons/web/icon-512-maskable.png",
  "/app-icons/web/apple-touch-icon.png",
  "/images/error.webp",
  "/images/brand-mark.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Reads the fallback from this worker's shell cache, never another origin cache. */
async function getOfflineFallback() {
  const cache = await caches.open(CACHE_NAME);

  return (await cache.match("/offline.html")) ?? Response.error();
}

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(fetch(event.request).catch(getOfflineFallback));
});
