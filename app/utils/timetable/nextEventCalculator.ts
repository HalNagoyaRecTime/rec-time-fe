// === 次の予定計算ユーティリティ ===
import type { EventRow } from "~/api/student";

/**
 * HHmm形式の時刻を "HH:MM" 形式にフォーマット
 * @param hhmm - "0930" 形式の文字列
 * @returns "9:30" 形式の文字列
 */
export function formatTime(hhmm: string | null): string {
    if (!hhmm || hhmm.length !== 4) return "";
    const hour = parseInt(hhmm.substring(0, 2), 10);
    const minute = hhmm.substring(2, 4);
    return `${hour}:${minute}`;
}

/**
 * 現在時刻から次に参加するイベントを取得
 * @param events - イベントリスト
 * @returns 次のイベント、または null
 */
export function getNextParticipatingEvent(events: EventRow[]): EventRow | null {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    // 参加予定のイベントのみフィルタ
    const myEvents = events.filter((event) => event.f_is_my_entry === true);

    // 現在時刻以降のイベントを抽出
    const upcomingEvents = myEvents.filter((event) => {
        if (!event.f_start_time) return false;
        const startTime = parseInt(event.f_start_time, 10);
        return startTime > currentTime;
    });

    // 開始時刻が最も早いイベントを返す
    if (upcomingEvents.length === 0) return null;

    upcomingEvents.sort((a, b) => {
        const aTime = parseInt(a.f_start_time || "0", 10);
        const bTime = parseInt(b.f_start_time || "0", 10);
        return aTime - bTime;
    });

    return upcomingEvents[0];
}

/**
 * イベント開始までの残り時間を計算
 * @param startTime - 開始時刻 ("0930" 形式)
 * @param gatherTime - 集合時刻 ("0920" 形式、オプション)
 * @returns 残り時間の文字列 ("30分後", "1時間30分後" など)
 */
export function getTimeUntilEvent(startTime: string | null, gatherTime?: string | null): string {
    if (!startTime) return "";

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const startHour = parseInt(startTime.substring(0, 2), 10);
    const startMinute = parseInt(startTime.substring(2, 4), 10);
    const startMinutes = startHour * 60 + startMinute;

    const diffMinutes = startMinutes - currentMinutes;

    // 集合時間が設定されている場合、集合時間内かチェック
    if (gatherTime) {
        const gatherHour = parseInt(gatherTime.substring(0, 2), 10);
        const gatherMinute = parseInt(gatherTime.substring(2, 4), 10);
        const gatherMinutes = gatherHour * 60 + gatherMinute;

        // 集合時間を過ぎて、開始時間前の場合は「まもなく」
        if (currentMinutes >= gatherMinutes && currentMinutes < startMinutes) {
            return "まもなく";
        }
    }

    // 開始時刻を過ぎた場合は「開催中!」
    if (diffMinutes < 0) return "開催中!";

    // 1分以内は「まもなく」
    if (diffMinutes <= 1) return "まもなく";

    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;

    if (hours > 0 && mins > 0) {
        return `${hours}時間${mins}分後`;
    } else if (hours > 0) {
        return `${hours}時間後`;
    } else {
        return `${mins}分後`;
    }
}

/**
 * 集合時間が過ぎたかどうかを判定
 * @param gatherTime - 集合時刻 ("0930" 形式)
 * @returns 集合時間が過ぎている場合true
 */
export function isGatherTimePassed(gatherTime: string | null): boolean {
    if (!gatherTime) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const gatherHour = parseInt(gatherTime.substring(0, 2), 10);
    const gatherMinute = parseInt(gatherTime.substring(2, 4), 10);
    const gatherMinutes = gatherHour * 60 + gatherMinute;

    // 集合時間から10分以上経過したら非表示
    return currentMinutes - gatherMinutes >= 10;
}
