// public/sw.js
// 통합 Service Worker: 캐싱 + 백그라운드 알림 + FCM

const APP_VERSION = "2025-10-25-02";
const CACHE_NAME = `rec-time-cache-${APP_VERSION}`;
const DATA_CACHE_NAME = `rec-time-data-cache-${APP_VERSION}`;

// === Firebase SDK Import ===
// Firebase Cloud Messaging을 위한 SDK 로드
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyAUDY7ty75NHqwfmT4xGiTeJj3f5VT0Duc",
  authDomain: "rec-time-593b0.firebaseapp.com",
  projectId: "rec-time-593b0",
  storageBucket: "rec-time-593b0.firebasestorage.app",
  messagingSenderId: "885151050655",
  appId: "1:885151050655:web:873c0e58da98316a4fabaa",
  measurementId: "G-5YRL3CV57Z"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

console.log('[SW] Firebase 초기화 완료');

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

// === IndexedDB를 통한 알람 스케줄 영구 저장 ===
const DB_NAME = 'rec-time-alarms';
const DB_VERSION = 1;
const STORE_NAME = 'scheduled-notifications';

// IndexedDB 초기화
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

// 알람 스케줄을 IndexedDB에 저장
async function saveNotificationsToDB(notifications) {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        // 기존 데이터 삭제 후 새 데이터 저장
        return new Promise((resolve, reject) => {
            // 먼저 clear
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => {
                // 새 데이터 저장
                let savedCount = 0;
                if (notifications.length === 0) {
                    console.log(`[SW] IndexedDB에 알람 스케줄 저장 완료 (0개)`);
                    resolve();
                    return;
                }
                
                notifications.forEach((notif, index) => {
                    const putRequest = store.put({ id: index, ...notif });
                    putRequest.onsuccess = () => {
                        savedCount++;
                        if (savedCount === notifications.length) {
                            console.log(`[SW] IndexedDB에 ${notifications.length}개의 알람 스케줄 저장 완료`);
                            resolve();
                        }
                    };
                    putRequest.onerror = () => reject(putRequest.error);
                });
            };
            clearRequest.onerror = () => reject(clearRequest.error);
        });
    } catch (error) {
        console.error('[SW] IndexedDB 저장 실패:', error);
    }
}

// IndexedDB에서 알람 스케줄 복원
async function loadNotificationsFromDB() {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const notifications = request.result.map(item => {
                    const { id, ...notif } = item;
                    return notif;
                });
                console.log(`[SW] IndexedDB에서 ${notifications.length}개의 알람 스케줄 복원`);
                resolve(notifications);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('[SW] IndexedDB 로드 실패:', error);
        return [];
    }
}

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
        
        // IndexedDB에 저장 (오프라인 대비)
        saveNotificationsToDB(scheduledNotifications);
        
        console.log(`[SW] ${scheduledNotifications.length}件の通知をスケジュールしました`);
        
        // ループがまだ開始されていなければ開始
        if (!checkLoopRunning) {
            startNotificationCheckLoop();
        }
    }
    
    // 通知を停止
    if (data.type === "STOP_NOTIFICATIONS") {
        console.log("[SW] 通知停止");
        scheduledNotifications = [];
        checkLoopRunning = false;
    }
});

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
    // IndexedDB에서 스케줄 복원 (오프라인 대비)
    if (scheduledNotifications.length === 0) {
        const savedNotifications = await loadNotificationsFromDB();
        if (savedNotifications.length > 0) {
            scheduledNotifications = savedNotifications;
            console.log(`[SW] IndexedDB에서 스케줄 복원: ${scheduledNotifications.length}개`);
        }
    }
    
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
            
            // IndexedDB 업데이트
            saveNotificationsToDB(scheduledNotifications);
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

// === FCM Background Message Handler ===
// 백엔드에서 보낸 FCM 푸시 알림을 받아서 표시
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] FCM 백그라운드 메시지 수신:', payload);

    const notificationTitle = payload.notification?.title || 'RecTime 알림';
    const notificationOptions = {
        body: payload.notification?.body || '새로운 알림이 있습니다',
        icon: '/icons/pwa-192.png',
        badge: '/icons/pwa-192.png',
        tag: payload.data?.eventId || 'fcm-background-notification',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: payload.data || {},
        actions: [
            {
                action: 'open',
                title: '앱 열기',
                icon: '/icons/pwa-192.png'
            },
            {
                action: 'close',
                title: '닫기'
            }
        ]
    };

    // 알림 표시
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// === Notification Close Handler ===
self.addEventListener("notificationclose", (event) => {
    console.log("[SW] 알림이 닫혔습니다:", event.notification.data);
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
            .then(async () => {
                // 활성화 시 IndexedDB에서 스케줄 복원
                const savedNotifications = await loadNotificationsFromDB();
                if (savedNotifications.length > 0) {
                    scheduledNotifications = savedNotifications;
                    console.log(`[SW] 활성화 시 스케줄 복원: ${scheduledNotifications.length}개`);
                    
                    // 체크 루프 시작
                    if (!checkLoopRunning) {
                        startNotificationCheckLoop();
                    }
                }
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
