// Bhoomi service worker: fast repeat visits and a basic offline mode on slow rural networks.
const STATIC = 'bhoomi-static-v1';
const PAGES = 'bhoomi-pages-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => ![STATIC, PAGES].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
));

const staleWhileRevalidate = async (req, cacheName) => {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const fresh = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => hit);
  return hit || fresh;
};

const networkFirst = async (req, cacheName) => {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || (req.mode === 'navigate' ? cache.match('/') : Response.error());
  }
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (url.pathname.startsWith('/admin') || (url.pathname.startsWith('/api/') && url.pathname !== '/api/site')) return;
    if (req.mode === 'navigate' || url.pathname === '/api/site') return e.respondWith(networkFirst(req, PAGES));
    if (/^\/(css|js|vendor|uploads)\//.test(url.pathname) || /\.(svg|png|webp|jpg|ico)$/.test(url.pathname)) return e.respondWith(staleWhileRevalidate(req, STATIC));
    return;
  }
  if (/images\.unsplash\.com|fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) e.respondWith(staleWhileRevalidate(req, STATIC));
});
