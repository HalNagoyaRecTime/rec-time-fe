// public/sw.js
const APP_VERSION = "2025-09-15-01";
const CACHE_NAME = `rectime-cache-${APP_VERSION}`;

// キャッシュするリソース
const CACHE_RESOURCES = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/globals.css',
  '/src/index.css',
  '/manifest.json'
];

self.addEventListener("install", (event) => {
  console.log("[SW] install", APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching app resources");
      return cache.addAll(CACHE_RESOURCES);
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
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // キャッシュにある場合はそれを返す
      if (response) {
        return response;
      }
      // ネットワークからフェッチ
      return fetch(event.request).catch(() => {
        // ネットワークエラーの場合、HTMLリクエストならindex.htmlを返す
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;
  if (data.type === "LOG_JSON") {
    console.log("[SW] 受け取ったJSON:", data.payload);
  }
});