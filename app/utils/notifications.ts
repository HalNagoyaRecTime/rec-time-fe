// === 通知システム ===
import type { EventRow } from "~/api/student.js";

// === 파싱 함수: "0930" → Date ===
// === 時刻パース：「0930」→ Date ===
function parseHHMM(hhmm: string): Date | null {
    const match = hhmm.match(/^(\d{2})(\d{2})$/);
    if (!match) return null;
    const now = new Date();
    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        parseInt(match[1], 10),
        parseInt(match[2], 10),
        0
    );
}

// === 通知タイミングの設定 ===
type NotificationTiming = {
    type: 'gather' | 'start' | 'minutes_before';
    minutes?: number; // minutes_beforeの場合の分数
};

/**
 * 環境変数から通知タイミング設定を取得
 * 例: "gather,30,15,start" → [集合時間, 30分前, 15分前, 開始時間]
 */
function getNotificationTimings(): NotificationTiming[] {
    const timingsStr = import.meta.env.VITE_NOTIFICATION_TIMINGS || 'gather,start';
    const parts = timingsStr.split(',').map(s => s.trim());
    
    const timings: NotificationTiming[] = [];
    
    for (const part of parts) {
        if (part === 'gather') {
            timings.push({ type: 'gather' });
        } else if (part === 'start') {
            timings.push({ type: 'start' });
        } else {
            const minutes = parseInt(part, 10);
            if (!isNaN(minutes) && minutes > 0) {
                timings.push({ type: 'minutes_before', minutes });
            }
        }
    }
    
    return timings;
}

/**
 * イベントの通知時刻リストを計算
 * @returns { time: "HHmm", label: "集合時間" | "開始時間" | "30分前" }[]
 */
function calculateNotificationTimes(event: EventRow): Array<{ time: string; label: string }> {
    const timings = getNotificationTimings();
    const notifications: Array<{ time: string; label: string }> = [];
    
    for (const timing of timings) {
        if (timing.type === 'gather' && event.f_gather_time) {
            notifications.push({ time: event.f_gather_time, label: '集合時間' });
        } else if (timing.type === 'start' && event.f_start_time) {
            notifications.push({ time: event.f_start_time, label: '開始時間' });
        } else if (timing.type === 'minutes_before' && event.f_start_time && timing.minutes) {
            const startTime = parseHHMM(event.f_start_time);
            if (startTime) {
                const notifyTime = new Date(startTime.getTime() - timing.minutes * 60 * 1000);
                const hhmm = `${String(notifyTime.getHours()).padStart(2, '0')}${String(notifyTime.getMinutes()).padStart(2, '0')}`;
                notifications.push({ time: hhmm, label: `${timing.minutes}分前` });
            }
        }
    }
    
    return notifications;
}

// === 通知設定の保存・取得 ===
const NOTIFICATION_SETTING_KEY = "notification:enabled";
const NOTIFIED_EVENTS_KEY = "notification:notified_events";

export function saveNotificationSetting(enabled: boolean): void {
    localStorage.setItem(NOTIFICATION_SETTING_KEY, JSON.stringify(enabled));
}

export function getNotificationSetting(): boolean {
    const saved = localStorage.getItem(NOTIFICATION_SETTING_KEY);
    return saved ? JSON.parse(saved) : false;
}

// === 通知済みイベントの管理 ===
function getNotifiedEvents(): Set<string> {
    const saved = localStorage.getItem(NOTIFIED_EVENTS_KEY);
    if (!saved) return new Set();
    try {
        return new Set(JSON.parse(saved));
    } catch {
        return new Set();
    }
}

function markAsNotified(eventId: string, notificationTime: string, label: string): void {
    const key = `${eventId}_${notificationTime}_${label}`;
    const notified = getNotifiedEvents();
    notified.add(key);
    localStorage.setItem(NOTIFIED_EVENTS_KEY, JSON.stringify(Array.from(notified)));
}

function isAlreadyNotified(eventId: string, notificationTime: string, label: string): boolean {
    const key = `${eventId}_${notificationTime}_${label}`;
    return getNotifiedEvents().has(key);
}

// === 日付のリセット（日が変わったら通知履歴をクリア） ===
function resetNotificationHistoryIfNeeded(): void {
    const lastResetDate = localStorage.getItem("notification:last_reset_date");
    const today = new Date().toDateString();
    
    if (lastResetDate !== today) {
        localStorage.setItem(NOTIFIED_EVENTS_KEY, JSON.stringify([]));
        localStorage.setItem("notification:last_reset_date", today);
    }
}

// === 環境変数から指定日付を取得 ===
function getEventDate(): Date | null {
    const dateStr = import.meta.env.VITE_EVENT_DATE;
    if (!dateStr || dateStr.trim() === "" || dateStr.trim().toLowerCase() === "all") {
        return null; // 未設定または "all" の場合は毎日
    }
    
    const parsed = new Date(dateStr.trim());
    if (isNaN(parsed.getTime())) {
        console.warn(`[通知] 無効な日付フォーマット: ${dateStr}`);
        return null;
    }
    
    return parsed;
}

// === 今日がイベント日までの期間内かチェック ===
function isTodayEventDate(): boolean {
    const eventDate = getEventDate();
    
    if (!eventDate) {
        // 未設定または "all" の場合は常に有効
        return true;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 時刻をリセット
    
    const targetDate = new Date(eventDate);
    targetDate.setHours(0, 0, 0, 0); // 時刻をリセット
    
    // 今日がイベント日の当日または以前（イベント日まで）の場合に有効
    if (today <= targetDate) {
        return true;
    } else {
        return false;
    }
}

// === 알림 권한 요청 ===
// === 通知権限要求 ===
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
        console.warn("[通知] この環境では通知がサポートされていません");
        return "denied";
    }

    // iOS PWAの場合、ホーム画面に追加されているか確認
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;

    if (isIOS && !isStandalone) {
        console.warn("[通知] iOS: ホーム画面に追加してから通知を有効にしてください");
        return "denied";
    }

    if (Notification.permission === "default") {
        try {
            const permission = await Notification.requestPermission();
            return permission;
        } catch (error) {
            return "denied";
        }
    }

    return Notification.permission;
}

// === 通知フォーマット関数（共通化） ===
function formatNotificationTitle(eventName: string): string {
    return `【予定】${eventName}`;
}

function formatNotificationBody(label: string, place: string): string {
    if (label === '開始時間') {
        return 'まもなく開始します。';
    } else if (label === '集合時間') {
        return `集合場所「${place}」に移動してください。`;
    } else if (label.includes('分前')) {
        return `開始「${label}」になりました。\n集合場所「${place}」に移動してください。`;
    } else {
        return `${label} - ${place}で間もなく始まります`;
    }
}

// === 알림 표시 ===
// === 通知表示 ===
export function showEventNotification(event: EventRow, label: string = '集合時間'): void {
    if (Notification.permission !== "granted") {
        console.warn("[通知] 権限が許可されていません");
        return;
    }

    const title = formatNotificationTitle(event.f_event_name ?? "イベント");
    const body = formatNotificationBody(label, event.f_place ?? "未定");
    
    // 重複防止用のタグ（同じtagの通知は自動的に置き換えられる）
    const tag = `event-${event.f_event_id}-${label}`;

    new Notification(title, { body, tag });
}

// === 設定オンオフ時の通知を表示 ===
export function showSettingNotification(message: string): void {
    if (Notification.permission !== "granted") {
        console.warn("[通知] 権限が許可されていません");
        return;
    }

    new Notification("RecTime 通知設定", { body: message });
}

// === 時刻チェック（定期実行用） ===
function checkAndNotifyEvent(event: EventRow): void {
    // 今日がイベント日でなければスキップ
    if (!isTodayEventDate()) {
        return;
    }

    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

    // イベントの全通知タイミングを取得
    const notificationTimes = calculateNotificationTimes(event);

    // 各通知タイミングをチェック
    for (const { time, label } of notificationTimes) {
        // 既に通知済みならスキップ
        if (isAlreadyNotified(event.f_event_id, time, label)) {
            continue;
        }

        // 現在時刻が通知時刻と一致したら通知
        if (currentTimeStr === time) {
            showEventNotification(event, label);
            markAsNotified(event.f_event_id, time, label);
        }
    }
}

// === 個別イベント通知スケジュール（setTimeout用） ===
function scheduleNotification(event: EventRow): void {
    // 今日がイベント日でなければスキップ
    if (!isTodayEventDate()) {
        console.log(`[予約] ${event.f_event_name} → イベント日ではないためスキップ`);
        return;
    }

    const now = Date.now();
    const notificationTimes = calculateNotificationTimes(event);

    for (const { time, label } of notificationTimes) {
        const targetTime = parseHHMM(time);
        if (!targetTime) continue;

        const diff = targetTime.getTime() - now;

        if (diff > 0 && diff < 24 * 60 * 60 * 1000) { // 24時間以内
            setTimeout(() => {
                if (!isAlreadyNotified(event.f_event_id, time, label)) {
                    showEventNotification(event, label);
                    markAsNotified(event.f_event_id, time, label);
                }
            }, diff);
            console.log(`[予約] ${event.f_event_name} → ${label} (${time}) に通知予定（${Math.floor(diff / 1000 / 60)}分後）`);
        }
    }
}

// === グローバルに保存される定期チェック用タイマー ===
let notificationCheckInterval: number | null = null;

// === Service Workerにイベントを送信 ===
function sendEventsToServiceWorker(events: EventRow[]): void {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
        console.warn("[通知] Service Workerが利用できません");
        return;
    }

    const myEvents = events.filter(e => e.f_is_my_entry);
    
    // 各イベントの通知タイミングを計算してService Workerに送信
    const notificationData = myEvents.flatMap(event => {
        const times = calculateNotificationTimes(event);
        return times.map(({ time, label }) => ({
            f_event_id: event.f_event_id,
            f_event_name: event.f_event_name,
            f_place: event.f_place,
            notification_time: time,
            notification_label: label,
            notified: false,
        }));
    });
    
    navigator.serviceWorker.controller.postMessage({
        type: "SCHEDULE_NOTIFICATIONS",
        notifications: notificationData,
    });
    
    console.log(`[通知] Service Workerに${notificationData.length}件の通知を送信しました`);
}

// === Service Workerの通知を停止 ===
function stopServiceWorkerNotifications(): void {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
        return;
    }

    navigator.serviceWorker.controller.postMessage({
        type: "STOP_NOTIFICATIONS",
    });
    
    console.log("[通知] Service Workerの通知を停止しました");
}

// === 全イベント通知スケジュール ===
export function scheduleAllNotifications(events: EventRow[]): void {
    // 日付リセットチェック
    resetNotificationHistoryIfNeeded();

    // 通知が無効なら何もしない
    if (!getNotificationSetting()) {
        console.log("[通知] 通知設定が無効のため、スケジュールしません");
        stopNotificationCheck();
        stopServiceWorkerNotifications();
        return;
    }

    // 今日がイベント日でなければスキップ
    if (!isTodayEventDate()) {
        // isTodayEventDate() 内で既にログ出力済み
        stopNotificationCheck();
        stopServiceWorkerNotifications();
        return;
    }

    console.log("[通知] 通知スケジュールを開始します");

    // 参加予定のイベントのみフィルタリング
    const myEvents = events.filter(e => e.f_is_my_entry);

    // Service Workerにイベントを送信（バックグラウンド通知用）
    sendEventsToServiceWorker(myEvents);

    // setTimeoutでスケジュール（アプリが開いている場合の補助）
    // 注意: setIntervalと重複するため無効化を推奨
    // myEvents.forEach(scheduleNotification);

    // 定期チェックを開始（1分ごと、アプリが開いている場合の補助）
    startNotificationCheck(myEvents);
}

// === 定期チェック開始 ===
function startNotificationCheck(events: EventRow[]): void {
    // 既存のチェックを停止
    stopNotificationCheck();

    // 1分ごとにチェック
    notificationCheckInterval = window.setInterval(() => {
        if (!getNotificationSetting()) {
            stopNotificationCheck();
            return;
        }

        if (!isTodayEventDate()) {
            stopNotificationCheck();
            return;
        }

        events.forEach(checkAndNotifyEvent);
    }, 60000); // 60秒 = 1分

    console.log("[通知] 定期チェック開始（1分ごと）");
}

// === 定期チェック停止 ===
function stopNotificationCheck(): void {
    if (notificationCheckInterval !== null) {
        clearInterval(notificationCheckInterval);
        notificationCheckInterval = null;
        console.log("[通知] 定期チェック停止");
    }
}
