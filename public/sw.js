// public/sw.js

const APP_VERSION = "2025-10-16-02";
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

// === 通知管理 ===
// イベント通知データを受け取る
let scheduledNotifications = [];
let notificationCheckInterval = null;

self.addEventListener("message", (event) => {
    const data = event.data;
    if (!data) return;
    
    if (data.type === "LOG_JSON") {
        console.log("[SW] 受け取ったJSON:", data.payload);
    }
    
    // イベント通知をスケジュール
    if (data.type === "SCHEDULE_NOTIFICATIONS") {
        console.log("[SW] 通知スケジュール受信:", data.events);
        scheduledNotifications = data.events || [];
        startNotificationCheck();
    }
    
    // 通知を停止
    if (data.type === "STOP_NOTIFICATIONS") {
        console.log("[SW] 通知停止");
        stopNotificationCheck();
        scheduledNotifications = [];
    }
});

// === 通知チェック開始 ===
function startNotificationCheck() {
    // 既存のチェックを停止
    stopNotificationCheck();
    
    console.log("[SW] 通知チェック開始");
    
    // 即座に1回チェック
    checkAndSendNotifications();
    
    // 1分ごとにチェック
    notificationCheckInterval = setInterval(() => {
        checkAndSendNotifications();
    }, 60000); // 60秒
}

// === 通知チェック停止 ===
function stopNotificationCheck() {
    if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
        notificationCheckInterval = null;
        console.log("[SW] 通知チェック停止");
    }
}

// === 通知をチェックして送信 ===
async function checkAndSendNotifications() {
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

    console.log(`[SW] 通知チェック実行: ${currentTimeStr}`);

    for (const event of scheduledNotifications) {
        if (event.f_gather_time === currentTimeStr && !event.notified) {
            await showNotification(event);
            event.notified = true;
        }
    }
}

// === 通知を表示 ===
async function showNotification(event) {
    const title = `イベント通知: ${event.f_event_name || "イベント"}`;
    const options = {
        body: `${event.f_place || "場所未定"}で間もなく始まります`,
        icon: "/icons/pwa-192.png",
        badge: "/icons/pwa-192.png",
        tag: `event-${event.f_event_id}`,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: {
            eventId: event.f_event_id,
            eventName: event.f_event_name,
            place: event.f_place,
            gatherTime: event.f_gather_time,
        }
    };

    await self.registration.showNotification(title, options);
    console.log(`[SW] 通知表示: ${title}`);
}

// === 通知クリック時の処理 ===
self.addEventListener("notificationclick", (event) => {
    console.log("[SW] 通知がクリックされました:", event.notification.data);
    
    event.notification.close();
    
    // アプリを開く
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            // 既に開いているウィンドウがあればフォーカス
            for (const client of clientList) {
                if (client.url.includes(self.registration.scope) && "focus" in client) {
                    return client.focus();
                }
            }
            // なければ新しいウィンドウを開く
            if (clients.openWindow) {
                return clients.openWindow("/");
            }
        })
    );
});

// === Periodic Background Sync (将来的な拡張用) ===
// 注意: Periodic Background Syncは一部のブラウザでのみサポート
self.addEventListener("periodicsync", (event) => {
    if (event.tag === "check-notifications") {
        console.log("[SW] Periodic Sync: 通知チェック");
        event.waitUntil(checkAndSendNotifications());
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
