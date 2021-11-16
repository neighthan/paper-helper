// the precache manifest and code for importing workbox are injected automatically.
// The manifest gives info mapping URLs to cache items
workbox.core.setCacheNameDetails({prefix: "paper-helper"});

// The workboxSW.precacheAndRoute() method efficiently caches and responds to
// requests for URLs in the manifest. See https://goo.gl/S9QRab
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
    return
  }
  if (event.data.type == "syncDbx") {
    event.data.callback()
  }
})
