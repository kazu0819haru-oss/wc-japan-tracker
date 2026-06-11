/* Service Worker — アプリシェルのオフラインキャッシュ
   APIレスポンスはキャッシュせず（store.js が担当）、静的資産のみ。 */
const CACHE = "sbt-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/api.js",
  "./js/store.js",
  "./js/util.js",
  "./js/sampleData.js",
  "./js/views/home.js",
  "./js/views/schedule.js",
  "./js/views/live.js",
  "./js/views/watch.js",
  "./manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // API（Workers）はネット優先・キャッシュしない
  if (url.pathname.includes("/api/")) return;
  // 静的資産：キャッシュ優先、無ければネット
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (e.request.method === "GET" && res.ok && url.origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
