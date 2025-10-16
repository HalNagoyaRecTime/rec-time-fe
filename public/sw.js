// public/sw.js

const APP_VERSION = "2025-10-16-01";
const CACHE_NAME = `rec-time-cache-${APP_VERSION}`;
const DATA_CACHE_NAME = `rec-time-data-cache-${APP_VERSION}`;

// キャッシュするリソース
const STATIC_FILES = [
    // エントリーポイント
    "/",
    // 静的アセット
    "/favicon.ico",
    "/manifest.webmanifest",
    "/icons/pwa-192.png",
    "/icons/pwa-512.png",
    "/icons/app-icon/timetable.svg",
    "/icons/app-icon/map.svg",
    "/icons/app-icon/settings.svg",
    "/images/map-1f.jpg",
    "/images/map-2f.jpg",
    "/images/map-class-area.jpg",
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
            return cache.addAll(STATIC_FILES);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("[SW] activate", APP_VERSION);
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // 古いキャッシュを削除
                        if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
                            console.log("[SW] 古いキャッシュを削除:", cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;

    // 不正なURLや空のURLをスキップ
    if (!request.url) {
        console.warn("[SW] 空のURLリクエストをスキップ");
        return;
    }

    let url;
    try {
        url = new URL(request.url);
    } catch (e) {
        console.error("[SW] 無効なURL:", request.url, e);
        return;
    }

    // 同一オリジンのリクエストのみ処理（外部リソースは除外）
    if (url.origin !== location.origin) {
        return;
    }

    // ナビゲーションリクエスト（ページ遷移）の場合、常にindex.htmlを返す（SPA対応）
    if (request.mode === "navigate") {
        event.respondWith(
            caches.match("/").then((response) => {
                if (response) {
                    return response;
                }
                return fetch("/").catch((error) => {
                    console.error("[SW] ナビゲーション失敗（オフライン）:", error);
                    return new Response("Offline and index.html not cached", {
                        status: 503,
                        statusText: "Service Unavailable",
                    });
                });
            })
        );
        return;
    }

    // APIリクエストかどうかを判定（同一オリジンの /api/ またはバックエンドのフルURL）
    const isApiRequest =
        url.pathname.startsWith("/api/") ||
        (url.origin !== location.origin &&
            (url.pathname.includes("/api/events") ||
                url.pathname.includes("/api/students") ||
                url.pathname.includes("/api/entries")));

    // バックエンドAPIリクエストの場合、Network Firstでキャッシュ
    if (isApiRequest) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // ネットワークからの取得に成功した場合、キャッシュに保存
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(DATA_CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                            console.log("[SW] APIレスポンスをキャッシュに保存:", url.pathname);
                        });
                    }
                    return response;
                })
                .catch((error) => {
                    console.log("[SW] ネットワークエラー、キャッシュから取得:", url.pathname);
                    // ネットワークエラー時はキャッシュから返す
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            // キャッシュから取得したことを示すヘッダーを追加
                            const headers = new Headers(cachedResponse.headers);
                            headers.set("X-Cache-Source", "service-worker");
                            return new Response(cachedResponse.body, {
                                status: cachedResponse.status,
                                statusText: cachedResponse.statusText,
                                headers: headers,
                            });
                        }
                        throw error;
                    });
                })
        );
        return;
    }

    // 静的リソースのキャッシュ戦略: Cache First
    if (
        request.method === "GET" &&
        (url.pathname === "/" ||
            url.pathname.endsWith(".html") ||
            url.pathname.endsWith(".js") ||
            url.pathname.endsWith(".css") ||
            url.pathname.endsWith(".png") ||
            url.pathname.endsWith(".jpg") ||
            url.pathname.endsWith(".ico"))
    ) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                // キャッシュにない場合はネットワークから取得してキャッシュに保存
                return fetch(request)
                    .then((response) => {
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, responseClone);
                            });
                        }
                        return response;
                    })
                    .catch((error) => {
                        console.error("[SW] リソース取得失敗（オフライン）:", url.pathname, error);
                        // オフライン時にキャッシュがない場合はエラーレスポンスを返す
                        return new Response("Offline and resource not cached", {
                            status: 503,
                            statusText: "Service Unavailable",
                        });
                    });
            })
        );
    }
});
