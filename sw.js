/* ============================================================
   Depot Cockpit – Service Worker
   ------------------------------------------------------------
   Makes sure the app starts even without a network.

   IMPORTANT ON EVERY CHANGE TO index.html:
   Bump the VERSION below (e.g. 'v20' -> 'v21').
   Only then does the browser notice it has to load the new version.
   The old version is cleaned up automatically on activation.

   Stored data (localStorage) is NOT affected by this –
   it survives every update and every clearing of this cache.
   ============================================================ */

const VERSION = 'v39';
const CACHE   = 'depot-' + VERSION;

/* Everything the app needs to start. Relative paths so that it also
   works in a subfolder (e.g. username.github.io/depot/). */
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

/* ---------- Install: put the app shell into the cache once ---------- */
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    /* One by one instead of addAll: a missing file (an icon, say) must not
       make the whole installation fail. */
    await Promise.all(SHELL.map(u =>
      c.add(new Request(u, {cache: 'reload'})).catch(() => {})
    ));
  })());
});

/* ---------- Activate: remove old caches ---------- */
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k.startsWith('depot-') && k !== CACHE)
          .map(k => caches.delete(k))
    );
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.disable(); } catch (err) {}
    }
    await self.clients.claim();
  })());
});

/* ---------- Fetch: cache first, then refresh in the background ----------
   This way the app starts instantly offline and, when online, quietly picks up
   the newest version for the next start. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // do not touch foreign addresses

  e.respondWith((async () => {
    const cache  = await caches.open(CACHE);
    const cached = await cache.match(req, {ignoreSearch: true});

    const fromNet = fetch(req).then(res => {
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }).catch(() => null);

    if (cached) { e.waitUntil(fromNet); return cached; }

    const res = await fromNet;
    if (res) return res;

    /* No network and nothing cached: serve the app for page navigations. */
    if (req.mode === 'navigate') {
      const shell = await cache.match('./index.html', {ignoreSearch: true});
      if (shell) return shell;
    }
    return new Response('Offline and not cached.', {
      status: 503,
      headers: {'Content-Type': 'text/plain; charset=utf-8'}
    });
  })());
});

/* ---------- Apply an update immediately when the page asks for it ---------- */
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
