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

    console.log(`[nextEventCalculator] 전체 이벤트: ${events.length}개, 참가 이벤트: ${myEvents.length}개`);
    console.log(`[nextEventCalculator] 현재 시간: ${currentTime} (${now.getHours()}:${now.getMinutes()})`);

    // 1. 開催中のイベントを探す
    const ongoingEvent = myEvents.find((event) => isEventOngoing(event));
    if (ongoingEvent) {
        console.log(`[nextEventCalculator] 開催中のイベント: ${ongoingEvent.f_event_name} (${ongoingEvent.f_start_time})`);
        return ongoingEvent;
    }

    // 2. 開催中がない場合、現在 이후의 이벤트를 추출 (과거 이벤트 제외)
    const upcomingEvents = myEvents.filter((event) => {
        if (!event.f_start_time) {
            console.log(`[nextEventCalculator] 이벤트 ${event.f_event_name} - 시작 시간 없음`);
            return false;
        }
        const startTime = parseInt(event.f_start_time, 10);
        const isUpcoming = startTime >= currentTime;
        console.log(`[nextEventCalculator] 이벤트 ${event.f_event_name} - 시작: ${startTime}, 미래: ${isUpcoming}`);
        return isUpcoming;
    });

    console.log(`[nextEventCalculator] 미래 이벤트: ${upcomingEvents.length}개`);

    // 開始時刻が最も早いイベントを返す
    if (upcomingEvents.length === 0) {
        console.log(`[nextEventCalculator] 다음 이벤트 없음`);
        return null;
    }

    upcomingEvents.sort((a, b) => {
        const aTime = parseInt(a.f_start_time || "0", 10);
        const bTime = parseInt(b.f_start_time || "0", 10);
        return aTime - bTime;
    });

    console.log(`[nextEventCalculator] 다음 이벤트: ${upcomingEvents[0].f_event_name} (${upcomingEvents[0].f_start_time})`);
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

/**
 * イベントが現在開催中かどうかを判定
 * @param event - イベント
 * @returns 開催中の場合true
 */
export function isEventOngoing(event: { f_start_time?: string | null; f_duration?: string | null }): boolean {
    if (!event.f_start_time || !event.f_duration) return false;

    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const startTime = parseInt(event.f_start_time, 10);
    const duration = parseInt(event.f_duration, 10);

    // 終了時刻を計算（HHmm形式）
    const startHour = Math.floor(startTime / 100);
    const startMinute = startTime % 100;
    const totalMinutes = startHour * 60 + startMinute + duration;
    const endTime = Math.floor(totalMinutes / 60) * 100 + (totalMinutes % 60);

    return currentTime >= startTime && currentTime <= endTime;
}

/**
 * 呼び出し中（集合時刻が過ぎたがイベント終了に達していない）かどうかを判定
 * @param event - イベント
 * @returns 呼び出し中の場合true
 */
export function isCallingOut(event: { f_gather_time?: string | null; f_start_time?: string | null; f_duration?: string | null }): boolean {
    if (!event.f_gather_time || !event.f_start_time || !event.f_duration) return false;

    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const gatherTime = parseInt(event.f_gather_time, 10);
    const startTime = parseInt(event.f_start_time, 10);
    const duration = parseInt(event.f_duration, 10);

    // 終了時刻を計算（HHmm形式）
    const startHour = Math.floor(startTime / 100);
    const startMinute = startTime % 100;
    const totalMinutes = startHour * 60 + startMinute + duration;
    const endTime = Math.floor(totalMinutes / 60) * 100 + (totalMinutes % 60);

    // 集合時刻が過ぎて、イベント終了時刻に達していない場合
    return currentTime >= gatherTime && currentTime < endTime;
}

/**
 * すべてのイベントが終了したかどうかを判定
 * @param events - 参加予定のイベントリスト
 * @returns すべてのイベントが終了している場合true
 */
export function areAllEventsFinished(events: EventRow[]): boolean {
    if (events.length === 0) return false;

    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    // 参加予定のイベントのみフィルタ
    const myEvents = events.filter((event) => event.f_is_my_entry === true);

    if (myEvents.length === 0) return false;

    // 最後のイベントの終了時刻を計算
    const lastEvent = myEvents.reduce((latest, event) => {
        const eventEndTime = calculateEventEndTime(event);
        const latestEndTime = calculateEventEndTime(latest);
        return eventEndTime > latestEndTime ? event : latest;
    });

    const lastEventEndTime = calculateEventEndTime(lastEvent);
    return currentTime > lastEventEndTime;
}

/**
 * イベントの終了時刻を計算（HHmm形式）
 * @param event - イベント
 * @returns 終了時刻（HHmm形式）
 */
function calculateEventEndTime(event: EventRow): number {
    if (!event.f_start_time || !event.f_duration) return 0;

    const startTime = parseInt(event.f_start_time, 10);
    const duration = parseInt(event.f_duration, 10);

    const startHour = Math.floor(startTime / 100);
    const startMinute = startTime % 100;
    const totalMinutes = startHour * 60 + startMinute + duration;
    const endTime = Math.floor(totalMinutes / 60) * 100 + (totalMinutes % 60);

    return endTime;
}
