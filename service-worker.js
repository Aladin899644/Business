const CACHE_NAME = "sera-business-hub-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./app-icon.svg",
  "./app-icon-192.png",
  "./app-icon-512.png"
];
const APP_SHELL_PATHS = new Set(APP_SHELL.map(path => new URL(path, self.location.origin).pathname));

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(name => name.startsWith("sera-business-hub-") && name !== CACHE_NAME).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin || !APP_SHELL_PATHS.has(url.pathname)) return;

  event.respondWith(
    fetch(request).then(response => {
      if (!response.ok) return response;

      return caches.open(CACHE_NAME).then(cache =>
        cache.put(request, response.clone())
          .then(() => response)
          .catch(error => {
            console.error("Could not update the app shell cache:", error);
            return response;
          })
      );
    }).catch(error =>
      caches.match(request).then(cached => {
        if (cached) return cached;
        if (request.mode === "navigate") {
          return caches.match("./index.html").then(fallback => {
            if (fallback) return fallback;
            throw error;
          });
        }
        throw error;
      })
    )
  );
});
