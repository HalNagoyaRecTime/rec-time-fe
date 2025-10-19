// public/sw.js

const APP_VERSION = "2025-10-19-01"; // ← 배포 때마다 증가
const CACHE_NAME = `rec-time-cache-${APP_VERSION}`;
const DATA_CACHE_NAME = `rec-time-data-cache-${APP_VERSION}`;

// キャッシュするリソース
const STATIC_FILES = [
    "/",
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
let scheduledNotifications = [];
let notificationCheckInterval = null;

self.addEventListener("message", (event) => {
    const data = event.data;
    if (!data) return;

    if (data.type === "LOG_JSON") {
        console.log("[SW] 受け取ったJSON:", data.payload);
    }

    if (data.type === "SCHEDULE_NOTIFICATIONS") {
        console.log("[SW] 通知スケジュール受信:", data.notifications);
        scheduledNotifications = data.notifications || [];
        console.log(`[SW] ${scheduledNotifications.length}件の通知をスケジュールしました`);
        startNotificationCheck();
    }

    if (data.type === "STOP_NOTIFICATIONS") {
        console.log("[SW] 通知停止");
        stopNotificationCheck();
        scheduledNotifications = [];
    }
});

function startNotificationCheck() {
    stopNotificationCheck();
    console.log("[SW] 通知チェック開始");
    checkAndSendNotifications();
    notificationCheckInterval = setInterval(checkAndSendNotifications, 60000);
}

function stopNotificationCheck() {
    if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
        notificationCheckInterval = null;
        console.log("[SW] 通知チェック停止");
    }
}

async function checkAndSendNotifications() {
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

    console.log(`[SW] 通知チェック実行: ${currentTimeStr}, スケジュール件数: ${scheduledNotifications.length}`);

    for (const notification of scheduledNotifications) {
        if (notification.notification_time === currentTimeStr && !notification.notified) {
            console.log(`[SW] 通知送信: ${notification.f_event_name} (${notification.notification_label})`);
            await showNotification(notification);
            notification.notified = true;
        }
    }
}

async function showNotification(notification) {
    const title = `イベント通知: ${notification.f_event_name || "イベント"}`;
    const body = notification.notification_label
        ? `${notification.notification_label} - ${notification.f_place || "場所未定"}で間もなく始まります`
        : `${notification.f_place || "場所未定"}で間もなく始まります`;

    const options = {
        body,
        icon: "/icons/pwa-192.png",
        badge: "/icons/pwa-192.png",
        tag: `event-${notification.f_event_id}-${notification.notification_time}`,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: {
            eventId: notification.f_event_id,
            eventName: notification.f_event_name,
            place: notification.f_place,
            notificationTime: notification.notification_time,
            notificationLabel: notification.notification_label,
        },
    };

    await self.registration.showNotification(title, options);
    console.log(`[SW] 通知表示: ${title} - ${notification.notification_label}`);
}

self.addEventListener("notificationclick", (event) => {
    console.log("[SW] 通知がクリックされました:", event.notification.data);
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.registration.scope) && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow("/");
            }
        })
    );
});

// === Periodic Background Sync(将来用) ===
self.addEventListener("periodicsync", (event) => {
    if (event.tag === "check-notifications") {
        console.log("[SW] Periodic Sync: 通知チェック");
        event.waitUntil(checkAndSendNotifications());
    }
});

self.addEventListener("install", (event) => {
    console.log("[SW] install", APP_VERSION);
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_FILES)));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("[SW] activate", APP_VERSION);
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) =>
                Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
                            console.log("[SW] 古いキャッシュを削除:", cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;

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

    // ① ナビゲーションは Network First（最新HTML取得を最優先）
    if (request.mode === "navigate") {
        event.respondWith(
            (async () => {
                try {
                    const fresh = await fetch("/", { cache: "no-store" });
                    const clone = fresh.clone();
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put("/", clone);
                    return fresh;
                } catch (err) {
                    const cached = await caches.match("/");
                    if (cached) return cached;
                    console.error("[SW] ナビゲーション失敗（オフライン）:", err);
                    return new Response("Offline and index.html not cached", {
                        status: 503,
                        statusText: "Service Unavailable",
                    });
                }
            })()
        );
        return;
    }

    // ② APIリクエスト判定（同一オリジンの /api/*）
    const isApiRequest = url.origin === location.origin && url.pathname.startsWith("/api/");

    // ③ API は Network First（成功時のみDATA_CACHEへ保存）
    if (isApiRequest) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(DATA_CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                            console.log("[SW] APIレスポンスをキャッシュに保存:", url.pathname);
                        });
                    }
                    return response;
                })
                .catch(async (error) => {
                    console.log("[SW] ネットワークエラー、キャッシュから取得:", url.pathname);
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) {
                        const headers = new Headers(cachedResponse.headers);
                        headers.set("X-Cache-Source", "service-worker");
                        return new Response(cachedResponse.body, {
                            status: cachedResponse.status,
                            statusText: cachedResponse.statusText,
                            headers,
                        });
                    }
                    throw error;
                })
        );
        return;
    }

    // ④ 静的ファイルは Cache First（従来通り）
    if (
        request.method === "GET" &&
        (url.pathname === "/" ||
            url.pathname.endsWith(".html") ||
            url.pathname.endsWith(".js") ||
            url.pathname.endsWith(".css") ||
            url.pathname.endsWith(".png") ||
            url.pathname.endsWith(".jpg") ||
            url.pathname.endsWith(".svg") ||
            url.pathname.endsWith(".ico"))
    ) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(request)
                    .then((response) => {
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                        }
                        return response;
                    })
                    .catch((error) => {
                        console.error("[SW] リソース取得失敗（オフライン）:", url.pathname, error);
                        return new Response("Offline and resource not cached", {
                            status: 503,
                            statusText: "Service Unavailable",
                        });
                    });
            })
        );
    }
});
