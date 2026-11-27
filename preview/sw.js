const cacheName = "arcade-preview-583c58e830c5be23";
const scope = self.registration.scope;
const files = ["index.html", "manifest.webmanifest", "arcade-icon-192.png", "arcade-icon.png", "avatars.png", "engine/stockfish-19-lite-single.js", "engine/Copying.txt", "engine/SOURCE.txt", "engine/stockfish-19-lite-single.wasm", "engine/README.md", "engine/stockfish-v19.0.1-source.zip"].map(path => new URL(path, scope).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(files)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => (key.startsWith('arcade-solo-') || key.startsWith('arcade-preview-')) && key !== cacheName).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(scope)) return;
  const path = event.request.mode === 'navigate' ? files[0] : event.request.url;
  if (event.request.mode !== 'navigate' && !files.includes(path)) return;
  event.respondWith(caches.open(cacheName).then(async cache => (await cache.match(path)) || fetch(event.request)));
});
