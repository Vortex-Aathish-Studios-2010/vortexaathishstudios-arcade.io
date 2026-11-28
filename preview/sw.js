const cacheName = "arcade-preview-ffd2bfd26bce38bc";
const scope = self.registration.scope;
const files = ["index.html", "manifest.webmanifest", "covers/avoid-walls.webp", "covers/chess.webp", "covers/color-switch.webp", "covers/gravity-flip.webp", "covers/konoodle.webp", "covers/memory.webp", "covers/one-shot.webp", "covers/rooms.webp", "covers/sliding.webp", "covers/snake.webp", "covers/stack-tower.webp", "covers/sudoku.webp", "covers/tap-rush.webp", "covers/tetris.webp", "covers/three-cups.webp", "covers/tictactoe.webp", "covers/wordsearch.webp", "engine/Copying.txt", "engine/README.md", "engine/SOURCE.txt", "engine/stockfish-19-lite-single.js", "engine/stockfish-19-lite-single.wasm", "engine/stockfish-v19.0.1-source.zip", "type/barlow-OFL.txt", "type/barlow-condensed-800.ttf", "arcade-icon-192.png", "arcade-icon.png", "avatars.png"].map(path => new URL(path, scope).href);
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
