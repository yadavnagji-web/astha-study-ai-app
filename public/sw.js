const CACHE_NAME = 'astha-study-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip API routes from cache
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Network first with cache fallback only when offline
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
