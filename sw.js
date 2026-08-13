/* ============================================================
   Depot Cockpit – Service Worker
   ------------------------------------------------------------
   Sorgt dafür, dass die App auch ohne Netz startet.

   WICHTIG BEI JEDER ÄNDERUNG AN index.html:
   Unten die VERSION hochzählen (z. B. 'v20' -> 'v21').
   Nur dann merkt der Browser, dass er die neue Fassung laden muss.
   Die alte Version wird beim Aktivieren automatisch aufgeräumt.

   Gespeicherte Daten (localStorage) sind davon NICHT betroffen –
   sie überleben jedes Update und jedes Leeren dieses Caches.
   ============================================================ */

const VERSION = 'v23';
const CACHE   = 'depot-' + VERSION;

/* Alles, was die App zum Starten braucht. Relative Pfade, damit es
   auch in einem Unterordner funktioniert (z. B. username.github.io/depot/). */
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

/* ---------- Installation: App-Shell einmalig in den Cache legen ---------- */
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    /* Einzeln statt addAll: eine fehlende Datei (z. B. ein Icon) darf
       die Installation nicht komplett scheitern lassen. */
    await Promise.all(SHELL.map(u =>
      c.add(new Request(u, {cache: 'reload'})).catch(() => {})
    ));
  })());
});

/* ---------- Aktivierung: alte Caches entfernen ---------- */
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

/* ---------- Abruf: erst Cache, dann im Hintergrund auffrischen ----------
   So startet die App offline sofort und holt sich online still die
   neueste Fassung für den nächsten Start. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // fremde Adressen nicht anfassen

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

    /* Kein Netz und nichts im Cache: bei Seitenaufrufen die App ausliefern. */
    if (req.mode === 'navigate') {
      const shell = await cache.match('./index.html', {ignoreSearch: true});
      if (shell) return shell;
    }
    return new Response('Offline und nicht im Zwischenspeicher.', {
      status: 503,
      headers: {'Content-Type': 'text/plain; charset=utf-8'}
    });
  })());
});

/* ---------- Update sofort übernehmen, wenn die Seite darum bittet ---------- */
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
