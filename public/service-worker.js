// the precache manifest and code for importing workbox are injected automatically.
// The manifest gives info mapping URLs to cache items
workbox.core.setCacheNameDetails({prefix: "paper-helper"});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
    return
  }
  if (event.data.type == "logMsg") {
    console.log(event.data.msg)
    return
  }
  if (event.data.type == "syncDbx") {
    console.log("called syncDbx!")
    const db = event.data.db
    const todo = await db.todos.toCollection().first()
    console.log(todo)
    return
  }
})

// The workboxSW.precacheAndRoute() method efficiently caches and responds to
// requests for URLs in the manifest. See https://goo.gl/S9QRab
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
