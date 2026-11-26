import base64, hashlib, json, re, shutil, tempfile, subprocess
from pathlib import Path
root = Path(__file__).resolve().parents[1]
dest = root / 'preview/index.html'
def uri(p, mime):
    return 'data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
with tempfile.TemporaryDirectory() as tmp:
    project=Path(tmp)
    shutil.copytree(root/'src',project/'src')
    (project/'node_modules').symlink_to(root/'node_modules',target_is_directory=True)
    shutil.copy2(root/'tsconfig.app.json',project/'tsconfig.json')
    art = { '/covers/'+p.name: uri(p,'image/webp') for p in (root/'public/covers').glob('*.webp') }
    art['/arcade-icon.png']=uri(root/'public/arcade-icon.png','image/png')
    (project/'src/portableArt.ts').write_text('const art: Record<string,string> = '+json.dumps(art)+';\nexport function imageFor(path: string){ return art[path]; }')
    for p in (project/'src').rglob('*.tsx'):
        s=p.read_text()
        s,n1=re.subn(r'src="(/(?:covers/[^"]+|arcade-icon\.png))"',r'src={imageFor("\1")}',s)
        s,n2=re.subn(r'src=\{("/covers/" \+ g.id \+ "\.webp"|\x60/covers/\$\{game\.id\}\.webp\x60)\}',r'src={imageFor(\1)}',s)
        if n1+n2: p.write_text('import { imageFor } from "@/portableArt";\n'+s)
    app=project/'src/App.tsx'
    s=app.read_text().replace('BrowserRouter','HashRouter')
    app.write_text(s)
    entry=project/'src/main.tsx'
    entry.write_text(entry.read_text().split("if (import.meta.env.PROD")[0])
    subprocess.run([str(project/'node_modules/.bin/esbuild'),'src/main.tsx','--bundle','--minify','--jsx=automatic','--format=iife','--target=es2020','--loader:.css=empty','--define:process.env.NODE_ENV="production"','--define:import.meta.env='+json.dumps({'VITE_ARCADE_API_URL':'https://vortex-arcade-minigames.ajuponnu2009.chatgpt.site'}),'--outfile=bundle.js'],cwd=project,check=True)
    css=next((root/'dist/assets').glob('index-*.css')).read_text().replace('/type/barlow-condensed-800.ttf',uri(root/'public/type/barlow-condensed-800.ttf','font/ttf'))
    js=(project/'bundle.js').read_text() + ";if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));}"
    js=re.sub(r'(?i)</script',lambda _:r'<\/script',js)
    doc='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#101116"><meta name="color-scheme" content="dark"><link rel="manifest" href="./manifest.webmanifest"><title>Arcade.io · Mini Games</title><link rel="icon" href="'+art['/arcade-icon.png']+'"><style>'+css+'</style></head><body><div id="root"></div><script>'+js+'</script></body></html>'
    dest.write_text(doc)
    print('Playable preview created',dest.stat().st_size,'bytes')

cache_name = 'arcade-preview-' + hashlib.sha256(dest.read_bytes()).hexdigest()[:16]
worker = r"""const cacheName = __CACHE_NAME__;
const scope = self.registration.scope;
const files = ['index.html', 'manifest.webmanifest', 'arcade-icon-192.png', 'arcade-icon.png'].map(path => new URL(path, scope).href);
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
(root/'preview/sw.js').write_text(worker.replace('__CACHE_NAME__',json.dumps(cache_name)))
