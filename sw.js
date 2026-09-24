const CACHE = "mulligan-house-v8";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./src/app.js",
  "./src/flow.js",
  "./src/setup.js",
  "./src/cpu.js",
  "./src/course-view.js",
  "./src/engine.js",
  "./src/cards.js",
  "./src/storage.js",
  "./icon.svg",
  "./manifest.webmanifest",
  "./docs/RULES.md",
];
self.addEventListener("install", (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES))),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("mulligan-house-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== self.location.origin
  )
    return;
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request)),
  );
});

