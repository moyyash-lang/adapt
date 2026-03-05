// ADAPT PWA Service Worker
const CACHE = ‘adapt-v4-1’;
const ASSETS = [
‘./adapt_v4.html’,
‘./manifest.json’,
‘./icon-192.png’,
‘./icon-512.png’,
‘https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap’,
];

// インストール: 必須ファイルをキャッシュ
self.addEventListener(‘install’, e => {
e.waitUntil(
caches.open(CACHE).then(cache =>
// フォントはネットワーク失敗時はスキップ
Promise.allSettled(ASSETS.map(url => cache.add(url).catch(() => {})))
).then(() => self.skipWaiting())
);
});

// 起動: 古いキャッシュを削除
self.addEventListener(‘activate’, e => {
e.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
).then(() => self.clients.claim())
);
});

// フェッチ: キャッシュ優先 → ネットワーク → キャッシュフォールバック
self.addEventListener(‘fetch’, e => {
// POST / chrome-extension は無視
if(e.request.method !== ‘GET’) return;
if(!e.request.url.startsWith(‘http’)) return;

e.respondWith(
caches.match(e.request).then(cached => {
if(cached) return cached;
return fetch(e.request).then(res => {
// 成功したレスポンスをキャッシュに追加
if(res && res.status === 200 && res.type === ‘basic’){
const clone = res.clone();
caches.open(CACHE).then(c => c.put(e.request, clone));
}
return res;
}).catch(() => cached); // オフラインならキャッシュを返す
})
);
});