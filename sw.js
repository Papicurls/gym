// Network first, so a new version shows up the next time the app opens online.
// With no signal (or a slow one) the last saved copy opens instead.
const CACHE = 'gym-v1';
const WAIT_MS = 3000;

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', 'manifest.json', 'icon-180.png', 'icon-192.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (ev) => {
  ev.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  ev.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const net = fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    });
    net.catch(() => { /* answered from the cache below */ });
    try {
      const first = await Promise.race([net, new Promise((r) => setTimeout(r, WAIT_MS, null))]);
      if (first) return first;
    } catch (e) { /* offline */ }
    const hit = await cache.match(req, { ignoreSearch: true });
    return hit || net;
  })());
});
