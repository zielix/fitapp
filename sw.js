// Service worker: zapisuje pliki aplikacji w pamięci telefonu,
// dzięki czemu FitLog uruchamia się także bez internetu.
// Po każdej zmianie plików podbij numer wersji, żeby telefon pobrał nowe.
const CACHE = 'fitlog-v1';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'manifest.json', 'icons/icon-180.png', 'icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Najpierw sieć (świeża wersja), a gdy brak internetu — kopia z pamięci.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
