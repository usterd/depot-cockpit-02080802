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
2. **Bump `VERSION` in `sw.js`** (`'v20'` → `'v20.1'`). This is the only step
   people forget — without it the phone keeps serving the cached old version.
3. Commit. Open the app while online; it downloads the new version in the
   background and shows a notice.
4. Fully close the app (swipe it away from the app switcher) and reopen it. The
   new version is now active.

Your saved data is untouched by updates — the cache and `localStorage` are
separate stores.

## 4. Backups

`localStorage` is not permanent storage. iOS may clear it if the app is unused
for a long stretch, and it is wiped if you delete the home-screen icon and
Safari data. Use **Import / Daten → Backup (JSON) sichern** regularly and save
the file to iCloud Drive or Files. That backup is also how you move to a new
device.
