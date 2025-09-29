// public/sw.js
const APP_VERSION = "2025-09-12-01";
const CACHE_NAME = `rec-time-cache-${APP_VERSION}`;
const DATA_CACHE_NAME = `rec-time-data-cache-${APP_VERSION}`;

// キャッシュするリソース
const STATIC_FILES = [
  "/",
  "/mock.json",
  // 他の静的ファイルは実行時に動的に追加
];

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;
  if (data.type === "LOG_JSON") {
    console.log("[SW] 受け取ったJSON:", data.payload);
  }
});

self.addEventListener("install", (event) => {
  console.log("[SW] install", APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] キャッシュを開く");
      return cache.addAll(STATIC_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] activate", APP_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 古いキャッシュを削除
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log("[SW] 古いキャッシュを削除:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // JSONデータのキャッシュ戦略: Network First
  if (url.pathname.endsWith("/mock.json")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // ネットワークからの取得に成功した場合、キャッシュに保存
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // ネットワークエラー時はキャッシュから返す
          console.log("[SW] ネットワークエラー、キャッシュから取得:", url.pathname);
          console.log("[SW] オフライン状態: キャッシュされたJSONデータを表示中");
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              // キャッシュからの取得であることを示すヘッダーを追加
              const modifiedResponse = new Response(cachedResponse.body, {
                status: cachedResponse.status,
                statusText: cachedResponse.statusText,
                headers: {
                  ...Object.fromEntries(cachedResponse.headers.entries()),
                  'X-Cache-Source': 'service-worker'
                }
              });
              return modifiedResponse;
            }
            return cachedResponse;
          });
        })
    );
    return;
  }

  // 静的リソースのキャッシュ戦略: Cache First
  if (request.method === "GET" && (
    url.pathname === "/" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".ico")
  )) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // キャッシュにない場合はネットワークから取得してキャッシュに保存
          return fetch(request).then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
  }
});
