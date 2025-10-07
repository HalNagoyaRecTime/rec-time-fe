// === 通知システム ===
import type { EventRow } from "../api/student.js";

// === 通知設定の保存・取得 ===
const NOTIFICATION_SETTING_KEY = "notification:enabled";

export function saveNotificationSetting(enabled: boolean): void {
    localStorage.setItem(NOTIFICATION_SETTING_KEY, JSON.stringify(enabled));
}

export function getNotificationSetting(): boolean {
    const saved = localStorage.getItem(NOTIFICATION_SETTING_KEY);
    return saved ? JSON.parse(saved) : false;
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

// === 個別イベント通知スケジュール ===
function scheduleNotification(event: EventRow): void {
    if (!event.f_gather_time) return;

    const time = parseHHMM(event.f_gather_time);
    if (!time) return;

    const now = Date.now();
    const diff = time.getTime() - now;

    if (diff > 0) {
        setTimeout(() => showEventNotification(event), diff);
        console.log(`[予約] ${event.f_event_name} → ${event.f_gather_time} に通知予定`);
    }
}

// === 全イベント通知スケジュール ===
export function scheduleAllNotifications(events: EventRow[]): void {
    // 通知が無効なら何もしない
    if (!getNotificationSetting()) {
        console.log("[通知] 通知設定が無効のため、スケジュールしません");
        return;
    }
    // イベントのスケジュールを開始
    events.forEach(scheduleNotification);
}
