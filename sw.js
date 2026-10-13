// PdfCraft PWA service worker (demo fork, app v0.7.1)
const CACHE = 'pdfcraft-pwa-0.7.1';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './pdfcraft-web-b09094eba9929fc0.js',
  './pdfcraft-web-b09094eba9929fc0_bg.wasm',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // app never fetches cross-origin
  if (event.request.method !== 'GET') return;

  // index.html / navigations: network first, fall back to cache (offline)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // hashed wasm/js: immutable, cache first
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request))
  );
});
