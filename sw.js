// Parcours Christus 2026 - Service Worker (PWA)
// Strategy:
// - Precache core app shell for offline use
// - Network-first for HTML (so updates arrive), with offline fallback
// - Cache-first for static assets (icons/images/css/js/pdf)

const CACHE_VERSION = "christus-2026-v1.0.0";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.json",

  // Pages
  "./guide.html",
  "./meditation.html",

  // Data
  "./meditations-data.js",

  // Images
  "./parcours-christus.png",
  "./resume-parcours.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-192-maskable.png",
  "./icon-512-maskable.png",
  "./apple-touch-icon.png",
  "./favicon-64.png",

  // PDF (optional, keep if you ship it)
  "./presentation-parcours-christus.pdf"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      // Best-effort: don't fail install if one optional asset is missing.
      await Promise.allSettled(CORE_ASSETS.map((url) => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_VERSION ? null : caches.delete(k))))
    ).then(() => self.clients.claim())
  );
});

function isHTML(request){
  return request.mode === "navigate" ||
         (request.headers.get("accept") || "").includes("text/html");
}
function isStaticAsset(url){
  return /\.(png|jpg|jpeg|webp|svg|ico|css|js|pdf)$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests (GitHub Pages friendly)
  if (url.origin !== self.location.origin) return;

  // HTML: network-first (updates), fallback to cache/offline
  if (isHTML(req)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          return cached || caches.match("./offline.html");
        })
    );
    return;
  }

  // Static assets: cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        });
      })
    );
    return;
  }

  // Default: try network, then cache
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
