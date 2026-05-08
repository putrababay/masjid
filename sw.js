const CACHE_NAME = "masjid-pwa-v1";

const APP_SHELL_FILES = [
  "./",
  "./index.html",
  "./admin.php",
  "./db.php",
  "./khgt-proxy.php",
  "./manifest.webmanifest",
  "./1.jpg",
  "./11.jpg",
  "./2.jpg",
  "./3.jpg",
  "./4.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Data API dynamic selalu coba network dulu
  if (
    url.pathname.endsWith("/db.php") ||
    url.pathname.endsWith("/khgt-proxy.php")
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets: cache first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((networkRes) => {
          const responseClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkRes;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
