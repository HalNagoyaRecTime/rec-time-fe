// public/sw.js

const APP_VERSION = "2025-10-23";
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
    // フォントファイル（オフライン対応）
    "/fonts/NotoSansJP-Regular.ttf",
    "/fonts/NotoSansJP-Bold.ttf",
    "/fonts/NotoSansJP-Black.ttf",
];

// === 通知フォーマット関数（共通化） ===
function formatNotificationTitle(eventName) {
    return `【予定】${eventName || "イベント"}`;
}

function formatNotificationBody(label, place) {
    if (label === "開始時間") {
        return "まもなく開始します。";
    } else if (label === "集合時間") {
        return `集合場所「${place || "未定"}」に移動してください。`;
    } else if (label && label.includes("分前")) {
        return `開始「${label}」になりました。\n集合場所「${place || "未定"}」に移動してください。`;
    } else {
        return `${label || ""} - ${place || "場所未定"}で間もなく始まります`;
    }
}

// === 通知管理 ===
// IndexedDBでの永続化
const DB_NAME = "RecTimeNotificationsDB";
const DB_VERSION = 1;
const STORE_NAME = "scheduledNotifications";

let checkLoopRunning = false;
let keepAliveInterval = null;
const KEEP_ALIVE_INTERVAL = 5 * 60 * 1000; // 5分ごと

// === IndexedDB初期化 ===
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error("[SW] IndexedDB open error:", request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
                store.createIndex("notification_time", "notification_time", { unique: false });
                store.createIndex("notified", "notified", { unique: false });
            }
        };
    });
}

// === 通知スケジュールをIndexedDBに保存 ===
async function saveNotificationsToIndexedDB(notifications) {
    try {
        const db = await openDatabase();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        // 既存データをクリア
        await new Promise((resolve, reject) => {
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = () => reject(clearRequest.error);
        });

        // 新しい通知を保存
        for (const notification of notifications) {
            const record = {
                id: `${notification.f_event_id}_${notification.notification_time}_${notification.notification_label}`,
                ...notification,
            };

            await new Promise((resolve) => {
                const addRequest = store.add(record);
                addRequest.onsuccess = () => resolve();
                addRequest.onerror = () => {
                    console.warn("[SW] 通知保存エラー:", addRequest.error);
                    resolve(); // エラーでも続行
                };
            });
        }

    } catch (error) {
        console.error("[SW] IndexedDB保存エラー:", error);
    }
}

// === IndexedDBから通知スケジュールを取得 ===
async function getNotificationsFromIndexedDB() {
    try {
        const db = await openDatabase();
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => {
                console.error("[SW] IndexedDB取得エラー:", request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("[SW] IndexedDB取得エラー:", error);
        return [];
    }
}

// === 通知済みフラグを更新 ===
async function markAsNotifiedInIndexedDB(notificationId) {
    try {
        const db = await openDatabase();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        const notification = await new Promise((resolve, reject) => {
            const getRequest = store.get(notificationId);
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject(getRequest.error);
        });

        if (notification) {
            notification.notified = true;
            await new Promise((resolve, reject) => {
                const putRequest = store.put(notification);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            });
        }
    } catch (error) {
        console.error("[SW] 通知済みマーク失敗:", error);
    }
}

self.addEventListener("message", async (event) => {
    const data = event.data;
    if (!data) return;


    // イベント通知をスケジュール
    if (data.type === "SCHEDULE_NOTIFICATIONS") {

        // IndexedDBに保存
        await saveNotificationsToIndexedDB(data.notifications || []);

        // ループがまだ開始されていなければ開始
        if (!checkLoopRunning) {
            startNotificationCheckLoop();
        }

        // オフライン対応のKeep-Alive開始
        startKeepAlive();
    }

    // 通知を停止
    if (data.type === "STOP_NOTIFICATIONS") {

        // IndexedDBをクリア
        try {
            const db = await openDatabase();
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            store.clear();
        } catch (error) {
            console.error("[SW] IndexedDBクリアエラー:", error);
        }

        checkLoopRunning = false;
        stopKeepAlive();
    }
});

// === Keep-Alive機能（iOS PWA向け強化版） ===
let keepAliveFailCount = 0;
let currentKeepAliveInterval = KEEP_ALIVE_INTERVAL;

// API Base URLを取得
function getApiBaseUrl() {
    // 本番環境のデフォルトURL（Cloudflare Workers）
    const defaultUrl = "https://rec-time-be.ellan122316.workers.dev";

    // locationのhostnameで環境を判定
    if (self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1") {
        return "http://localhost:8787";
    }

    return defaultUrl;
}

const API_BASE_URL = getApiBaseUrl();

function startKeepAlive() {
    if (keepAliveInterval) {
        return;
    }

    // イベントまでの時間で間隔を調整
    adjustKeepAliveInterval();


    // 即座に1回実行
    performKeepAlive();

    // 定期的に実行
    keepAliveInterval = setInterval(() => {
        performKeepAlive();
    }, currentKeepAliveInterval);
}

function stopKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
        keepAliveFailCount = 0;
        currentKeepAliveInterval = KEEP_ALIVE_INTERVAL;
    }
}

// イベントまでの時間で間隔を調整（iOS PWA向けに短縮）
async function adjustKeepAliveInterval() {
    try {
        const notifications = await getNotificationsFromIndexedDB();

        if (notifications.length === 0) {
            currentKeepAliveInterval = KEEP_ALIVE_INTERVAL;
            return;
        }

        const now = new Date();
        const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;

        // 最も近い通知時刻を見つける
        let minDiff = Infinity;

        for (const notification of notifications) {
            const notifTime = notification.notification_time;
            if (!notifTime || notification.notified) continue;

            // 時刻差を分単位で計算
            const notifHour = parseInt(notifTime.substring(0, 2), 10);
            const notifMin = parseInt(notifTime.substring(2, 4), 10);
            const currentHour = parseInt(currentTimeStr.substring(0, 2), 10);
            const currentMin = parseInt(currentTimeStr.substring(2, 4), 10);

            const notifTotalMin = notifHour * 60 + notifMin;
            const currentTotalMin = currentHour * 60 + currentMin;
            const diff = notifTotalMin - currentTotalMin;

            if (diff > 0 && diff < minDiff) {
                minDiff = diff;
            }
        }

        // iOS PWA対応: イベント30分前から15秒ごとにチェック（実験的）
        if (minDiff <= 30) {
            currentKeepAliveInterval = 15 * 1000; // 15秒
        } else if (minDiff <= 60) {
            currentKeepAliveInterval = 60 * 1000; // 1分
        } else {
            currentKeepAliveInterval = KEEP_ALIVE_INTERVAL; // 5分
        }
    } catch (error) {
        console.error("[SW] Keep-Alive間隔調整エラー:", error);
        currentKeepAliveInterval = KEEP_ALIVE_INTERVAL;
    }
}

async function performKeepAlive() {
    try {

        // バックエンドの軽量なヘルスチェックエンドポイントにリクエスト
        // タイムアウトを短く設定（回線不安定対応）
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒タイムアウト

        const response = await fetch(`${API_BASE_URL}/api/health`, {
            method: "GET",
            cache: "no-cache",
            signal: controller.signal,
            headers: {
                "X-SW-Keep-Alive": "true", // Service Workerからのリクエストと識別
            },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();

            // 成功したら失敗カウントをリセット
            keepAliveFailCount = 0;

            // 通知チェックも実行
            await checkAndSendNotifications();

            // 間隔を再調整
            await adjustKeepAliveInterval();

            // 間隔が変わった場合は再起動
            if (keepAliveInterval) {
                clearInterval(keepAliveInterval);
                keepAliveInterval = setInterval(() => {
                    performKeepAlive();
                }, currentKeepAliveInterval);
            }
        } else {
            console.warn("[SW] Keep-Alive失敗: HTTPステータス", response.status);
            handleKeepAliveFailure();
        }
    } catch (error) {
        // ネットワークエラー時の処理
        if (error.name === "AbortError") {
            console.warn("[SW] Keep-Aliveタイムアウト（5秒）");
        } else {
            console.warn("[SW] Keep-Aliveエラー:", error.message);
        }

        handleKeepAliveFailure();
    }
}

// Keep-Alive失敗時の処理（オフライン時も動作を継続）
async function handleKeepAliveFailure() {
    keepAliveFailCount++;
    console.warn(`[SW] Keep-Alive連続失敗回数: ${keepAliveFailCount}`);

    // ネットワークが不安定でも通知チェックは継続
    try {
        await checkAndSendNotifications();
    } catch (error) {
        console.error("[SW] オフライン通知チェックエラー:", error);
    }

    // 連続失敗時も5分間隔を維持（バッテリー/回線節約）
    // オフライン時は通知チェックのみ継続
    if (keepAliveFailCount >= 3) {
        console.warn("[SW] Keep-Alive連続失敗（オフライン可能性）→ 通知チェックは継続");
        // 間隔変更なし（5分維持）
    }
}

// Keep-Aliveを再起動（間隔変更時）
function restartKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = setInterval(() => {
            performKeepAlive();
        }, currentKeepAliveInterval);
    }
}

// === 継続的な通知チェックループ ===
// setIntervalの代わりに再帰的なsetTimeoutを使用（より確実）
async function startNotificationCheckLoop() {
    if (checkLoopRunning) {
        return;
    }

    checkLoopRunning = true;

    async function checkLoop() {
        if (!checkLoopRunning) {
            return;
        }

        try {
            await checkAndSendNotifications();
        } catch (error) {
            console.error("[SW] 通知チェックエラー:", error);
        }

        // 60秒後に再度チェック（setIntervalより確実）
        setTimeout(checkLoop, 60000);
    }

    // 最初のチェックを即座に実行
    checkLoop();
}

// === 通知をチェックして送信 ===
async function checkAndSendNotifications() {
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;

    try {
        const notifications = await getNotificationsFromIndexedDB();
        (`[SW] 通知チェック実行: ${currentTimeStr}, スケジュール件数: ${notifications.length}`);

        for (const notification of notifications) {
            if (notification.notification_time === currentTimeStr && !notification.notified) {
                // アクティブなクライアントがある場合は、アプリ側に任せる
                try {
                    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

                    if (clients && clients.length > 0) {
                        continue;
                    }
                } catch (error) {
                    console.error("[SW] クライアントチェックエラー:", error);
                }

                await showNotification(notification);

                // 通知済みフラグを更新
                await markAsNotifiedInIndexedDB(notification.id);
            }
        }
    } catch (error) {
        console.error("[SW] 通知チェックエラー:", error);
    }
}

// === 通知を表示 ===
async function showNotification(notification) {
    const title = formatNotificationTitle(notification.f_event_name);
    const body = formatNotificationBody(notification.notification_label, notification.f_place);

    const options = {
        body: body,
        icon: "/icons/pwa-192.png",
        badge: "/icons/pwa-192.png",
        tag: `event-${notification.f_event_id}-${notification.notification_time}`,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        timestamp: Date.now(),
        data: {
            eventId: notification.f_event_id,
            eventName: notification.f_event_name,
            place: notification.f_place,
            notificationTime: notification.notification_time,
            notificationLabel: notification.notification_label,
        },
    };

    await self.registration.showNotification(title, options);
}

// === 通知クリック時の処理 ===
self.addEventListener("notificationclick", (event) => {

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

// === Periodic Background Sync (Chrome/Edgeでサポート) ===
// 注意: Periodic Background Syncは一部のブラウザでのみサポート
self.addEventListener("periodicsync", async (event) => {
    if (event.tag === "check-notifications") {
        event.waitUntil(checkAndSendNotifications());
    }
});

// === Push通知（将来的な拡張用） ===
self.addEventListener("push", (event) => {
    // 将来的にバックエンドからのプッシュ通知をサポートする場合
});

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_FILES);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // 古いキャッシュを削除
                        if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(async () => {
                // IndexedDBを初期化
                await openDatabase();

                // 通知チェックループを開始（既存の通知がある場合）
                const notifications = await getNotificationsFromIndexedDB();
                if (notifications.length > 0) {
                    startNotificationCheckLoop();
                    startKeepAlive();
                }

                return self.clients.claim();
            })
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
            url.pathname.endsWith(".svg") ||
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
