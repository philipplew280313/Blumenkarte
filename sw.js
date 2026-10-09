/* Service Worker: App läuft offline, Kartenkacheln werden gespeichert */
const SHELL_CACHE = 'shell-v8';
const TILES_CACHE = 'tiles-v1';
const SHELL = ['./', 'index.html', 'app.js', 'draw.js', 'regions.js', 'intro.js', 'manifest.webmanifest', 'vendor/leaflet.js', 'vendor/leaflet.css', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
const TILE_HOSTS = ['isk.geobasis-bb.de', 'geodienste.sachsen.de', 'www.geoproxy.geoportal-th.de', 'server.arcgisonline.com', 'tile.openstreetmap.org'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('shell-') && k !== SHELL_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const noCors = {};
async function tile(req) {
  const cache = await caches.open(TILES_CACHE);
  const hit = await cache.match(req.url);
  if (hit) return hit;
  const host = new URL(req.url).host;
  try {
    let res;
    if (!noCors[host]) {
      try { res = await fetch(req.url, { mode: 'cors', credentials: 'omit' }); }
      catch (e) { noCors[host] = true; }
    }
    if (!res) res = await fetch(req.url, { mode: 'no-cors', credentials: 'omit' });
    if (res.ok || res.type === 'opaque') cache.put(req.url, res.clone()).catch(() => {});
    return res;
  } catch (e) {
    return new Response('', { status: 504, statusText: 'offline' });
  }
}

async function shell(req) {
  const cache = await caches.open(SHELL_CACHE);
  const hit = await cache.match(req, { ignoreSearch: true });
  const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
  if (hit) { net; return hit; }              // sofort aus dem Speicher, im Hintergrund aktualisieren
  return (await net) || (req.mode === 'navigate' ? cache.match('index.html') : new Response('', { status: 504 }));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (TILE_HOSTS.some(h => url.hostname === h)) return e.respondWith(tile(req));
  if (url.origin === self.location.origin) return e.respondWith(shell(req));
});
