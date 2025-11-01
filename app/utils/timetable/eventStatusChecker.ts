// === イベント状態判定ユーティリティ ===
import type { EventRow } from "~/api/student";
import { getCurrentTime } from "~/utils/currentTimeManager";
import { convertTimeToMinutes } from "~/utils/timetable/timeFormatter";

/**
 * イベントが現在開催中かどうかを判定
 * @param event - イベント
 * @returns 開催中の場合true
 */
export function isEventOngoing(event: { f_start_time?: string | null; f_duration?: string | null }): boolean {
    if (!event.f_start_time || !event.f_duration) return false;

    const now = getCurrentTime();
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

    const now = getCurrentTime();
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
 * 集合時間が過ぎたかどうかを判定
 * @param gatherTime - 集合時刻 ("0930" 形式)
 * @returns 集合時間が過ぎている場合true
 */
export function isGatherTimePassed(gatherTime: string | null): boolean {
    if (!gatherTime) return false;

    const now = getCurrentTime();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const gatherMinutes = convertTimeToMinutes(gatherTime);

    // 集合時間から10分以上経過したら非表示
    return currentMinutes - gatherMinutes >= 10;
}

/**
 * すべてのイベントが終了したかどうかを判定
 * @param events - 参加予定のイベントリスト
 * @returns すべてのイベントが終了している場合true
 */
export function areAllEventsFinished(events: EventRow[]): boolean {
    if (events.length === 0) return false;

    const now = getCurrentTime();
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
