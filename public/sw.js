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

  // Skip API routes, chrome extensions, and non-GET requests from service worker
  if (
    url.pathname.startsWith('/api/') ||
    event.request.method !== 'GET' ||
    !url.protocol.startsWith('http')
  ) {
    return;
  }

  // Network first with safe cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Safely cache successful responses for offline use
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});
