// public/sw.js

const APP_VERSION = "2025-10-18-01";
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
    "/fonts/NotoSansJP-Regular.woff2",
    "/fonts/NotoSansJP-Bold.woff2",
    "/fonts/NotoSansJP-Black.woff2",
    "/fonts/Inter-Regular.woff2",
    "/fonts/Inter-SemiBold.woff2",
    "/fonts/Inter-Bold.woff2",
];

// === 通知フォーマット関数（共通化） ===
function formatNotificationTitle(eventName) {
    return `【予定】${eventName || "イベント"}`;
}

function formatNotificationBody(label, place) {
    if (label === '開始時間') {
        return 'まもなく開始します。';
    } else if (label === '集合時間') {
        return `集合場所「${place || "未定"}」に移動してください。`;
    } else if (label && label.includes('分前')) {
        return `開始「${label}」になりました。\n集合場所「${place || "未定"}」に移動してください。`;
    } else {
        return `${label || ''} - ${place || "場所未定"}で間もなく始まります`;
    }
}

// === 通知管理 ===
// イベント通知データを受け取る
let scheduledNotifications = [];
let checkLoopRunning = false;
let keepAliveInterval = null;
const KEEP_ALIVE_INTERVAL = 5 * 60 * 1000; // 5分ごと

// API Base URLを取得（環境変数から）
// 本番環境では環境変数 VITE_API_BASE_URL から取得
// 開発環境ではデフォルトURL
function getApiBaseUrl() {
    // Service Workerでは import.meta.env が使えないため、
    // メインスレッドから受け取るか、デフォルト値を使用
    // 本番: https://rec-time-be.ellan122316.workers.dev
    // 開発: http://localhost:8787
    
    // 本番環境のデフォルトURL（Cloudflare Workers）
    const defaultUrl = 'https://rec-time-be.ellan122316.workers.dev';
    
    // locationのhostnameで環境を判定
    if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
        return 'http://localhost:8787/api';
    }
    
    return `${defaultUrl}/api`;
}

const API_BASE_URL = getApiBaseUrl();

self.addEventListener("message", (event) => {
    const data = event.data;
    if (!data) return;
    
    if (data.type === "LOG_JSON") {
        console.log("[SW] 受け取ったJSON:", data.payload);
    }
    
    // イベント通知をスケジュール
    if (data.type === "SCHEDULE_NOTIFICATIONS") {
        console.log("[SW] 通知スケジュール受信:", data.notifications);
        scheduledNotifications = data.notifications || [];
        console.log(`[SW] ${scheduledNotifications.length}件の通知をスケジュールしました`);
        
        // ループがまだ開始されていなければ開始
        if (!checkLoopRunning) {
            startNotificationCheckLoop();
        }
        
        // Keep-Alive開始
        startKeepAlive();
    }
    
    // 通知を停止
    if (data.type === "STOP_NOTIFICATIONS") {
        console.log("[SW] 通知停止");
        scheduledNotifications = [];
        checkLoopRunning = false;
        stopKeepAlive();
    }
});

// === Keep-Alive機能（Service Workerを起こし続ける） ===
let keepAliveFailCount = 0; // 連続失敗回数
let currentKeepAliveInterval = KEEP_ALIVE_INTERVAL; // 現在の間隔

function startKeepAlive() {
    if (keepAliveInterval) {
        console.log("[SW] Keep-Aliveは既に実行中");
        return;
    }
    
    // イベントまでの時間で間隔を調整
    adjustKeepAliveInterval();
    
    console.log(`[SW] Keep-Alive開始 (${currentKeepAliveInterval / 1000}秒ごと)`);
    
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
        console.log("[SW] Keep-Alive停止");
    }
}

// イベントまでの時間で間隔を調整
function adjustKeepAliveInterval() {
    try {
        if (scheduledNotifications.length === 0) {
            currentKeepAliveInterval = KEEP_ALIVE_INTERVAL;
            return;
        }
        
        const now = new Date();
        
        // 最も近い通知時刻を見つける
        let nearestTime = null;
        let minDiff = Infinity;
        
        for (const notification of scheduledNotifications) {
            const notifTime = notification.notification_time;
            if (!notifTime) continue;
            
            const notifHour = parseInt(notifTime.substring(0, 2), 10);
            const notifMin = parseInt(notifTime.substring(2, 4), 10);
            const notifDate = new Date();
            notifDate.setHours(notifHour, notifMin, 0, 0);
            
            const diff = notifDate.getTime() - now.getTime();
            
            if (diff > 0 && diff < minDiff) {
                minDiff = diff;
                nearestTime = notifDate;
            }
        }
        
        // 5分以内にイベントがある場合は1分ごと
        if (minDiff <= 5 * 60 * 1000) {
            currentKeepAliveInterval = 60 * 1000; // 1分
            console.log("[SW] イベントまで5分以内 → Keep-Alive間隔を1分に短縮");
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
        console.log("[SW] Keep-Alive: サーバーに疎通チェック送信");
        
        // サーバーの軽量なエンドポイントにリクエスト
        const response = await fetch(`${API_BASE_URL}/api/health`, {
            method: 'GET',
            cache: 'no-cache'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log("[SW] Keep-Alive成功:", data);
            
            // 成功したら失敗カウントをリセット
            if (keepAliveFailCount > 0) {
                keepAliveFailCount = 0;
                // 5分間隔に戻す（イベント直前でなければ）
                adjustKeepAliveInterval();
                restartKeepAlive();
            }
        } else {
            console.warn("[SW] Keep-Alive失敗: HTTPステータス", response.status);
            handleKeepAliveFailure();
        }
    } catch (error) {
        console.error("[SW] Keep-Aliveエラー:", error);
        handleKeepAliveFailure();
    }
}

// Keep-Alive失敗時の処理
function handleKeepAliveFailure() {
    keepAliveFailCount++;
    console.warn(`[SW] Keep-Alive連続失敗回数: ${keepAliveFailCount}`);
    
    // 3回連続失敗したら1分間隔に短縮
    if (keepAliveFailCount >= 3 && currentKeepAliveInterval !== 60 * 1000) {
        console.warn("[SW] Keep-Alive連続失敗 → 間隔を1分に短縮");
        currentKeepAliveInterval = 60 * 1000;
        restartKeepAlive();
    }
}

// Keep-Aliveを再起動（間隔変更時）
function restartKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = setInterval(() => {
            performKeepAlive();
        }, currentKeepAliveInterval);
        console.log(`[SW] Keep-Alive間隔を${currentKeepAliveInterval / 1000}秒に変更`);
    }
}

// === 継続的な通知チェックループ ===
// setIntervalの代わりに再帰的なsetTimeoutを使用（より確実）
async function startNotificationCheckLoop() {
    if (checkLoopRunning) {
        console.log("[SW] チェックループは既に実行中");
        return;
    }
    
    checkLoopRunning = true;
    console.log("[SW] 通知チェックループ開始");
    
    async function checkLoop() {
        if (!checkLoopRunning) {
            console.log("[SW] チェックループ停止");
            return;
        }
        
        try {
            await checkAndSendNotifications();
        } catch (error) {
            console.error("[SW] 通知チェックエラー:", error);
        }
        
        // 30秒後に再度チェック（setIntervalより確実）
        setTimeout(checkLoop, 30000);
    }
    
    // 最初のチェックを即座に実行
    checkLoop();
}

// === 通知をチェックして送信 ===
async function checkAndSendNotifications() {
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

    console.log(`[SW] 通知チェック実行: ${currentTimeStr}, スケジュール件数: ${scheduledNotifications.length}`);

    for (const notification of scheduledNotifications) {
        if (notification.notification_time === currentTimeStr && !notification.notified) {
            
            // 既に送信済みかチェック（LocalStorageと連携）
            try {
                const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
                
                // アクティブなクライアントがある場合は、アプリ側に任せる
                if (clients && clients.length > 0) {
                    console.log(`[SW] アクティブなクライアントがあるため、アプリ側に通知を任せます`);
                    continue;
                }
            } catch (error) {
                console.error('[SW] クライアントチェックエラー:', error);
            }
            
            console.log(`[SW] 通知送信: ${notification.f_event_name} (${notification.notification_label})`);
            await showNotification(notification);
            notification.notified = true;
        }
    }
}

// === 通知を表示 ===
async function showNotification(notification) {
    const title = formatNotificationTitle(notification.f_event_name);
    const body = formatNotificationBody(
        notification.notification_label,
        notification.f_place
    );
    
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
        }
    };

    await self.registration.showNotification(title, options);
    console.log(`[SW] 通知表示: ${title} - ${notification.notification_label}`);
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
