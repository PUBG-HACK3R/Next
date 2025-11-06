const CACHE_NAME = 'smartgrow-v2-' + Date.now() // Dynamic cache name to force refresh
const STATIC_CACHE = 'smartgrow-static-v1'

const staticAssets = [
  '/favicon_1.jpeg',
  '/app_icon.png',
  '/manifest.json'
]

const dynamicPages = [
  '/',
  '/dashboard',
  '/login',
  '/signup'
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(staticAssets)),
      self.skipWaiting() // Force activation of new service worker
    ])
  )
})

// Fetch event with network-first strategy for dashboard pages
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // For dashboard pages, always fetch from network first
  if (url.pathname.startsWith('/dashboard') || dynamicPages.includes(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Don't cache dashboard responses
          return response
        })
        .catch(() => {
          // Fallback to cache only if network fails
          return caches.match(event.request)
        })
    )
    return
  }
  
  // For static assets, use cache first
  if (staticAssets.some(asset => url.pathname.includes(asset))) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    )
    return
  }
  
  // Default: network first for everything else
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  )
})

// Activate event - clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      self.clients.claim() // Take control of all clients immediately
    ])
  )
})

// Message event for manual cache clearing
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('Clearing cache:', cacheName)
            return caches.delete(cacheName)
          })
        )
      }).then(() => {
        event.ports[0].postMessage({ success: true })
      })
    )
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
