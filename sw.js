const CACHE_NAME = 'contas-do-mes-v3';
const APP_FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  // Always check for the newest shell files so installed Android apps receive
  // visual and manifest updates without getting stuck on an old cached copy.
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('/index.html') || url.pathname.endsWith('/manifest.webmanifest') || url.pathname.endsWith('/sw.js')) {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok && url.pathname.endsWith('/index.html')) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  })));
});
