// Service worker: zapisuje pliki aplikacji w pamięci telefonu,
// dzięki czemu FitLog uruchamia się także bez internetu.
// Po każdej zmianie plików podbij numer wersji (tu i APP_VERSION w app.js).
const CACHE = 'fitlog-v3';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'manifest.json', 'icons/icon-180.png', 'icons/icon-192.png'];

self.addEventListener('install', (e) => {
  // cache: 'no-store' — pobierz na pewno z serwera, a nie z pamięci przeglądarki
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(FILES.map((f) => fetch(f, { cache: 'no-store' }).then((res) => c.put(f, res))))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Najpierw sieć (świeża wersja), a gdy brak internetu — kopia z pamięci.
// GitHub Pages każe przeglądarce trzymać pliki 10 min (max-age=600),
// dlatego wymuszamy pobranie z serwera: cache 'no-store'.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(url.href, { cache: 'no-store' })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
