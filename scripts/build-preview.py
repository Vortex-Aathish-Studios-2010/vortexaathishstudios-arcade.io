"""Build a self-contained, subdirectory-safe PWA for GitHub Pages.

Game assets remain local files and are precached. Source components use
publicAsset(), so this build never rewrites JSX or depends on its formatting.
"""
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
preview = root / "preview"
preview.mkdir(exist_ok=True)

# Copy only files this offline edition needs. Keep the copied-file list explicit
# so an old build's leftovers cannot accidentally enter the new cache.
asset_files = []
for name in ["covers", "engine", "type"]:
    for source in sorted((root / "public" / name).rglob("*")):
        if not source.is_file():
            continue
        relative = source.relative_to(root / "public")
        target = preview / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        asset_files.append(relative.as_posix())
for name in ["arcade-icon-192.png", "arcade-icon.png", "avatars.png"]:
    shutil.copy2(root / "public" / name, preview / name)
    asset_files.append(name)

with tempfile.TemporaryDirectory() as tmp:
    project = Path(tmp)
    shutil.copytree(root / "src", project / "src")
    (project / "server").mkdir()
    shutil.copy2(root / "server/live-engine.mjs", project / "server/live-engine.mjs")
    (project / "node_modules").symlink_to(root / "node_modules", target_is_directory=True)
    shutil.copy2(root / "tsconfig.app.json", project / "tsconfig.json")
    app = project / "src/App.tsx"
    app.write_text(app.read_text().replace("BrowserRouter", "HashRouter"))
    entry = project / "src/main.tsx"
    entry.write_text(entry.read_text().split("if (import.meta.env.PROD")[0])
    subprocess.run(
        [
            str(project / "node_modules/.bin/esbuild"),
            "src/main.tsx",
            "--bundle",
            "--minify",
            "--jsx=automatic",
            "--format=iife",
            "--target=es2020",
            "--loader:.css=empty",
            '--define:process.env.NODE_ENV="production"',
            "--define:import.meta.env=" + json.dumps({
                "VITE_ARCADE_API_URL": "https://vortex-arcade-minigames.ajuponnu2009.chatgpt.site",
                "VITE_PUBLIC_BASE": "./",
            }),
            "--outfile=bundle.js",
        ],
        cwd=project,
        check=True,
    )
    css_files = list((root / "dist/assets").glob("index-*.css"))
    if len(css_files) != 1:
        raise RuntimeError("Run npm run build before building the preview.")
    # The stylesheet is inline, so relative font URLs resolve against /preview/.
    css = css_files[0].read_text().replace("/type/", "./type/")
    js = (project / "bundle.js").read_text()
    js += ";if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}"
    js = re.sub(r"(?i)</script", lambda _: r"<\/script", js)
    doc = (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<meta name="theme-color" content="#111713"><meta name="color-scheme" content="dark">'
        '<meta name="apple-mobile-web-app-capable" content="yes">'
        '<link rel="manifest" href="./manifest.webmanifest">'
        '<title>Arcade.io · Mini Games</title>'
        '<link rel="icon" href="./arcade-icon.png">'
        '<link rel="apple-touch-icon" href="./arcade-icon.png">'
        '<style>' + css + '</style></head><body><div id="root"></div><script>'
        + js + '</script></body></html>'
    )
    (preview / "index.html").write_text(doc)

preview_assets = ["index.html", "manifest.webmanifest", *asset_files]
digest = hashlib.sha256()
for name in preview_assets:
    digest.update(name.encode())
    digest.update((preview / name).read_bytes())
cache_name = "arcade-preview-" + digest.hexdigest()[:16]
worker = r"""const cacheName = __CACHE_NAME__;
const scope = self.registration.scope;
const files = __FILES__.map(path => new URL(path, scope).href);
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
"""
(preview / "sw.js").write_text(
    worker.replace("__CACHE_NAME__", json.dumps(cache_name))
    .replace("__FILES__", json.dumps(preview_assets))
)
print("Offline preview created:", len(preview_assets), "local files,", (preview / "index.html").stat().st_size, "HTML bytes")
