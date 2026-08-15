# Depot Cockpit — offline iOS install

A single-file, fully client-side app. No server, no backend, no accounts.
All data lives in the browser's `localStorage` on your device.

## Files

| File | Purpose |
|---|---|
| `index.html` | The app itself (unchanged logic, plus manifest links + service worker registration) |
| `sw.js` | Service worker — makes the app start without a network connection |
| `manifest.json` | App name, colours, icons for the home-screen entry |
| `icon-180.png` | iOS home-screen icon |
| `icon-192.png` / `icon-512.png` / `icon-512-maskable.png` | Manifest icons (Android/desktop) |

All paths are **relative**, so this works both at the root of a domain and in a
subfolder such as `https://username.github.io/depot/`.

## 1. Publish on GitHub Pages

1. Create a repository, e.g. `depot`.
2. Upload all files listed above to the repository root (drag-and-drop into the
   GitHub web UI works fine — no git client needed).
3. **Settings → Pages → Build and deployment → Source: “Deploy from a branch”**,
   branch `main`, folder `/ (root)`. Save.
4. Wait ~1 minute. The URL appears at the top of the same page:
   `https://username.github.io/depot/`

### Privacy note

GitHub Pages sites are **publicly reachable**, even when built from a private
repository (private-repo Pages requires a paid plan, and even then it is
access-controlled rather than truly hidden on the free tier). The published
files contain only the empty app — **none of your transaction data is ever
uploaded**, because everything is stored locally on the device. Still, if you
would rather the app itself not be findable:

- give the repo an unguessable name (`depot-7f3a91c4`), and/or
- use Cloudflare Pages / Netlify, which offer password protection, or
- self-host on any HTTPS URL you control.

What matters technically is only that the URL is **HTTPS** — service workers and
reliable `localStorage` persistence do not work over `file://`.

## 2. Install on the iPhone

1. Open the URL **in Safari** (not Chrome — only Safari can add to the home screen).
2. Let the page load fully once **while online**. This is when the service
   worker caches the app.
3. Share button → **Add to Home Screen** → Add.
4. Launch it from the home screen. It opens full-screen, without Safari's UI.
5. Test it: enable airplane mode and open the app again. It must start normally.

## 3. Updating the app later

When you change `index.html`:

1. Edit the file in the repo.
2. **Bump `VERSION` in `sw.js`** (`'v24'` → `'v25'`). This is the only step
   people forget — without it the phone keeps serving the cached old version.
   Add a matching entry at the top of the `CHANGELOG` array in `index.html`
   (same version number, one short line per feature) — it is what
   **Settings → Version history** shows, and the topmost entry is
   displayed as the version currently running.
3. Commit. Open the app while online; it downloads the new version in the
   background and shows a notice.
4. Fully close the app (swipe it away from the app switcher) and reopen it. The
   new version is now active.

Your saved data is untouched by updates — the cache and `localStorage` are
separate stores.

## 4. Security posture

The app makes **no network requests of its own** — no `fetch`, no XHR, no
WebSocket, no beacons, no external scripts, fonts or CDNs. Your transaction data
only ever leaves the device when *you* trigger an export or backup and pick a
destination in the iOS share sheet.

Hardening applied:

- **Content-Security-Policy** (`<meta>` tag in the head). `connect-src 'self'`,
  `img-src 'self' data: blob:` and `form-action 'none'` mean that even injected
  code could not transmit anything to a foreign host. Delivered as a meta tag
  because GitHub Pages does not allow custom response headers.
- **Escaping.** `esc()` now also escapes `'`; a new `js()` helper is used
  wherever a value from a CSV lands inside an `onclick` attribute (ISINs,
  comment keys), and the `status` field is escaped rather than injected raw
  into a `class` attribute.
- **Image sources validated.** Only embedded `data:image/...;base64` values are
  rendered. Remote URLs, `svg+xml`, and attribute-breakout attempts are dropped.
- **Backup import validated.** `cleanBackup()` accepts only the expected fields,
  coerces numbers, rebuilds transaction IDs and filters images. A tampered
  backup file can no longer inject content into the UI.

Remaining consideration: `localStorage` is scoped to the **origin**
(`username.github.io`), not to the subfolder. Any other site you publish under
the same GitHub account can read this app's data. Other users' `github.io`
subdomains cannot. Use a dedicated account or a separate domain if that matters.

## 5. Backups

`localStorage` is not permanent storage. iOS may clear it if the app is unused
for a long stretch, and it is wiped if you delete the home-screen icon and
Safari data. Use **Settings → Save backup (JSON)** regularly and save
the file to iCloud Drive or Files. That backup is also how you move to a new
device.
