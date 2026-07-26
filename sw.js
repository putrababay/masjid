const CACHE_NAME = "masjid-pwa-v3";

const APP_SHELL_FILES = [
  "./",
  "./index.html",
  "./login.html",
  "./admin.html",
  "./user_masjid.html",
  "./jadwal.html",
  "./js/db.js",
  "./manifest.webmanifest",
  "./icon.svg",
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

  // API dan resource lintas domain tidak pernah masuk cache aplikasi.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigasi/HTML selalu network-first agar deployment Git terbaru langsung terlihat.
  if (
    event.request.mode === "navigate" ||
    event.request.destination === "document"
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          );
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(event.request)) ||
            (await caches.match("./index.html"))
          );
        })
    );
    return;
  }

  // Asset lokal: stale-while-revalidate.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((networkRes) => {
          const responseClone = networkRes.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
              return cache.put(event.request, responseClone);
            })
          );
          return networkRes;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
