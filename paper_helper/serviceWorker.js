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

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const cacheKeys = await caches.keys()
    await Promise.all(cacheKeys.map((key) => {
      if (key === cacheName) { return }
      await caches.delete(key)
    }))
  })())
})
