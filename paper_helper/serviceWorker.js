const cacheName = "paper-helper-v1"
const assets = [
  "/",
  "/index.html",
  "/main.js",
  "/img/icons/192x192.png",
  "/img/icons/512x512.png",
]

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(cacheName).then(cache => {
      cache.addAll(assets)
    })
  )
})

self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request)
    })
  )
})

self.addEventListener("activate", (activateEvent) => {
  activateEvent.waitUntil(
    caches.keys().then((cacheKeys) => {
      return Promise.all(cacheKeys.map((key) => {
        if (key !== cacheName) {
          console.log("deleting cache", key)
          return caches.delete(key)
        }
      }))
    })
  )
})
