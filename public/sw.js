// Service Worker for offline PWA support
const CACHE_NAME = "future-self-v1"

// Files to cache on install (app shell)
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icon-512.png",
]

// Install — cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  // Take control of all pages immediately
  self.clients.claim()
})

// Fetch — network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== "GET") return

  // For navigation requests (HTML pages) — network first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest version
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    )
    return
  }

  // For static assets (JS, CSS, images) — cache first, then network
  if (request.url.match(/\.(js|css|png|jpg|svg|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
            return response
          })
      )
    )
    return
  }

  // Everything else — network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})
