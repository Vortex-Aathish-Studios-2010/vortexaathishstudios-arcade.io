import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const files = (await readdir("dist", { recursive: true, withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name !== "sw.js")
  .map((entry) =>
    (entry.parentPath + "/" + entry.name).replace(/^.*?dist\//, "/"),
  )
  .sort();
const digest = createHash("sha256");
for (const path of files) digest.update(await readFile("dist" + path));
const cacheName = "vortex-offline-" + digest.digest("hex").slice(0, 16);
await writeFile(
  "dist/sw.js",
  `
const cacheName = ${JSON.stringify(cacheName)};
const assets = ${JSON.stringify(files)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('vortex-offline-') && k !== cacheName).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  const page = event.request.mode === 'navigate';
  if (!page && !assets.includes(url.pathname)) return;
  event.respondWith(caches.open(cacheName).then(async cache => (await cache.match(page ? '/index.html' : url.pathname)) || fetch(event.request)));
});`,
);
