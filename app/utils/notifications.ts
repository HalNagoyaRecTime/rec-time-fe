// === 通知システム ===
import type { EventRow } from "~/api/student.js";

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

function markAsNotified(eventId: string, gatherTime: string): void {
    const key = `${eventId}_${gatherTime}`;
    const notified = getNotifiedEvents();
    notified.add(key);
    localStorage.setItem(NOTIFIED_EVENTS_KEY, JSON.stringify(Array.from(notified)));
}

function isAlreadyNotified(eventId: string, gatherTime: string): boolean {
    const key = `${eventId}_${gatherTime}`;
    return getNotifiedEvents().has(key);
}

// === 日付のリセット（日が変わったら通知履歴をクリア） ===
function resetNotificationHistoryIfNeeded(): void {
    const lastResetDate = localStorage.getItem("notification:last_reset_date");
    const today = new Date().toDateString();
    
    if (lastResetDate !== today) {
        localStorage.setItem(NOTIFIED_EVENTS_KEY, JSON.stringify([]));
        localStorage.setItem("notification:last_reset_date", today);
        console.log("[通知] 日付が変わったため、通知履歴をリセットしました");
    }
}

// === 環境変数から指定日付を取得 ===
function getEventDate(): Date | null {
    const dateStr = import.meta.env.VITE_EVENT_DATE;
    if (!dateStr || dateStr.trim() === "") {
        return null; // 未設定の場合は毎日
    }
    
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
        console.warn(`[通知] 無効な日付フォーマット: ${dateStr}`);
        return null;
    }
    
    return parsed;
}

// === 今日がイベント日かチェック ===
function isTodayEventDate(): boolean {
    const eventDate = getEventDate();
    if (!eventDate) {
        return true; // 未設定なら毎日有効
    }
    
    const today = new Date();
    return (
        eventDate.getFullYear() === today.getFullYear() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getDate() === today.getDate()
    );
}

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
            console.log(`[通知] 権限要求結果: ${permission}`);
            return permission;
        } catch (error) {
            console.error("[通知] 権限要求エラー:", error);
            return "denied";
        }
    }

    return Notification.permission;
}

// === 알림 표시 ===
// === 通知表示 ===
export function showEventNotification(event: EventRow): void {
    if (Notification.permission !== "granted") {
        console.warn("[通知] 権限が許可されていません");
        return;
    }

    const title = `イベント通知: ${event.f_event_name ?? "イベント"}`;
    const body = `${event.f_place ?? "場所未定"}で間もなく始まります`;

    new Notification(title, { body });
    console.log(`[通知] 表示: ${title}`);
}

// === 設定オンオフ時の通知を表示 ===
export function showSettingNotification(message: string): void {
    if (Notification.permission !== "granted") {
        console.warn("[通知] 権限が許可されていません");
        return;
    }

    new Notification("RecTime 通知設定", { body: message });
    console.log(`[通知] 設定変更: ${message}`);
}

// === 時刻チェック（定期実行用） ===
function checkAndNotifyEvent(event: EventRow): void {
    if (!event.f_gather_time) return;

    // 今日がイベント日でなければスキップ
    if (!isTodayEventDate()) {
        return;
    }

    // 既に通知済みならスキップ
    if (isAlreadyNotified(event.f_event_id, event.f_gather_time)) {
        return;
    }

    const targetTime = parseHHMM(event.f_gather_time);
    if (!targetTime) return;

    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

    // 現在時刻が集合時刻と一致したら通知
    if (currentTimeStr === event.f_gather_time) {
        showEventNotification(event);
        markAsNotified(event.f_event_id, event.f_gather_time);
    }
}

// === 個別イベント通知スケジュール（setTimeout用） ===
function scheduleNotification(event: EventRow): void {
    if (!event.f_gather_time) return;

    // 今日がイベント日でなければスキップ
    if (!isTodayEventDate()) {
        console.log(`[予約] ${event.f_event_name} → イベント日ではないためスキップ`);
        return;
    }

    const time = parseHHMM(event.f_gather_time);
    if (!time) return;

    const now = Date.now();
    const diff = time.getTime() - now;

    if (diff > 0 && diff < 24 * 60 * 60 * 1000) { // 24時間以内
        setTimeout(() => {
            if (!isAlreadyNotified(event.f_event_id, event.f_gather_time!)) {
                showEventNotification(event);
                markAsNotified(event.f_event_id, event.f_gather_time!);
            }
        }, diff);
        console.log(`[予約] ${event.f_event_name} → ${event.f_gather_time} に通知予定（${Math.floor(diff / 1000 / 60)}分後）`);
    }
}

// グローバルに保存される定期チェック用タイマー
let notificationCheckInterval: number | null = null;

// === 全イベント通知スケジュール ===
export function scheduleAllNotifications(events: EventRow[]): void {
    // 日付リセットチェック
    resetNotificationHistoryIfNeeded();

    // 通知が無効なら何もしない
    if (!getNotificationSetting()) {
        console.log("[通知] 通知設定が無効のため、スケジュールしません");
        stopNotificationCheck();
        return;
    }

    // 今日がイベント日でなければスキップ
    if (!isTodayEventDate()) {
        const eventDate = getEventDate();
        console.log(`[通知] 今日はイベント日ではありません（指定日: ${eventDate?.toLocaleDateString() ?? "毎日"}）`);
        stopNotificationCheck();
        return;
    }

    console.log("[通知] 通知スケジュールを開始します");

    // 参加予定のイベントのみフィルタリング
    const myEvents = events.filter(e => e.f_is_my_entry && e.f_gather_time);

    // setTimeoutでスケジュール
    myEvents.forEach(scheduleNotification);

    // 定期チェックを開始（1分ごと）
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
