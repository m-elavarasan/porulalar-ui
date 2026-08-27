const CACHE_NAME = 'porulalar-pwa-v3';

// Static core assets to pre-cache if needed
const STATIC_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Skip caching for non-http(s), API endpoints, analytics, workers, and heavy binary formats like PDFs
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (
    url.pathname.includes('/_vercel') ||
    url.pathname.includes('/api/') ||
    url.pathname.endsWith('.pdf') ||
    url.pathname.includes('worker') ||
    url.search.includes('pdf')
  ) {
    return;
  }

  // Network-First with Cache Fallback strategy for non-static assets
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Cache static JS/CSS/image assets only
        if (
          response &&
          response.status === 200 &&
          response.type === 'basic' &&
          (url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.png') ||
            url.pathname === '/' ||
            url.pathname === '/index.html')
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (e.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
