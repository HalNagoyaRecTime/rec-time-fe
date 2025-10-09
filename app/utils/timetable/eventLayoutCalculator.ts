// === イベント重なり検出・レイアウト計算 ===
import type { EventRow } from "~/api/student";
import type { EventLayout, EventTimeRange } from "~/types/timetable";
import { TIMETABLE_CONSTANTS } from "~/types/timetable";

const { START_HOUR, SLOT_HEIGHT_PX, EVENT_HEIGHT_MARGIN_PX } = TIMETABLE_CONSTANTS;

/**
 * イベントの長さを5分単位で計算（最小10分）
 */
function getEventDurationUnits(event: EventRow): number {
    if (!event.f_start_time || !event.f_duration) return 0;
    const durationMinutes = parseInt(event.f_duration, 10);
    // 10分未満は10分に切り上げ
    const adjustedDuration = Math.max(durationMinutes, 10);
    return Math.ceil(adjustedDuration / 5);
}

/**
 * イベントの重なりを検出し、レイアウト情報を計算
 * @param events - イベント配列
 * @returns イベントIDとレイアウト情報のMap
 */
export function calculateEventLayout(events: EventRow[]): Map<string, EventLayout> {
    const eventPositions = new Map<string, EventLayout>();

    // 時間順でソート
    const sortedEvents = [...events].sort((a, b) => {
        const aTime = parseInt(a.f_start_time || "0", 10);
        const bTime = parseInt(b.f_start_time || "0", 10);
        return aTime - bTime;
    });

    // 重なりを検出するための配列
    const columns: Array<{ events: EventRow[]; endTime: number }> = [];

    // イベントごとの時間範囲を保存
    const eventTimeRanges: Map<string, EventTimeRange> = new Map();

    sortedEvents.forEach((event) => {
        if (!event.f_start_time) return;

        const startTime = parseInt(event.f_start_time, 10);
        const startHours = Math.floor(startTime / 100);
        const startMinutes = startTime % 100;
        const startTotalMinutes = startHours * 60 + startMinutes;
        const baseMinutes = START_HOUR * 60; // 9:00基準
        const eventStartUnits = Math.floor((startTotalMinutes - baseMinutes) / 5); // 5分単位に変更

        // 終了時刻を計算
        const durationMinutes = parseInt(event.f_duration || "0", 10);
        const endTotalMinutes = startTotalMinutes + durationMinutes;
        const endHours = Math.floor(endTotalMinutes / 60);
        const endMinutes = endTotalMinutes % 60;
        const endTime = endHours * 100 + endMinutes;

        // 時間範囲を保存
        eventTimeRanges.set(event.f_event_id, { start: startTime, end: endTime });

        // 利用可能なカラムを探す
        let columnIndex = columns.findIndex((col) => col.endTime <= startTime);

        if (columnIndex === -1) {
            // 新しいカラムを作成
            columnIndex = columns.length;
            columns.push({ events: [], endTime: 0 });
        }

        // カラムにイベントを追加
        columns[columnIndex].events.push(event);
        columns[columnIndex].endTime = endTime;

        // ポジション情報を保存
        eventPositions.set(event.f_event_id, {
            top: eventStartUnits * SLOT_HEIGHT_PX,
            height: getEventDurationUnits(event) * SLOT_HEIGHT_PX - EVENT_HEIGHT_MARGIN_PX,
            column: columnIndex,
            totalColumns: 0,
            actualColumns: 1, // 後で計算
            positionIndex: 0, // 後で計算
        });
    });

    // 各イベントの実際の重複数と位置インデックスを計算
    eventPositions.forEach((position, eventId) => {
        const timeRange = eventTimeRanges.get(eventId);
        if (!timeRange) return;

        // このイベントと重複するイベントのIDリスト（自分を含む）
        const overlappingEventIds: string[] = [eventId];
        eventTimeRanges.forEach((otherRange, otherEventId) => {
            if (eventId === otherEventId) return;

            // 時間範囲が重複しているかチェック（終了時刻 = 開始時刻は重複しない）
            const isOverlapping =
                timeRange.start < otherRange.end &&
                timeRange.end > otherRange.start &&
                !(timeRange.end === otherRange.start || timeRange.start === otherRange.end);

            if (isOverlapping) {
                overlappingEventIds.push(otherEventId);
            }
        });

        // actualColumns = このイベント期間中に同時に存在する最大カラム数を計算
        let maxSimultaneousColumns = 1;

        // イベント期間を5分刻みでスキャンして、各時点での同時存在イベント数を数える
        const startMinutes = Math.floor(timeRange.start / 100) * 60 + (timeRange.start % 100);
        const endMinutes = Math.floor(timeRange.end / 100) * 60 + (timeRange.end % 100);

        for (let minute = startMinutes; minute < endMinutes; minute += 5) {
            const currentTime = Math.floor(minute / 60) * 100 + (minute % 60);
            let simultaneousCount = 0;

            // この時点で存在するイベント数を数える
            overlappingEventIds.forEach((id) => {
                const range = eventTimeRanges.get(id);
                if (range && range.start <= currentTime && currentTime < range.end) {
                    simultaneousCount++;
                }
            });

            maxSimultaneousColumns = Math.max(maxSimultaneousColumns, simultaneousCount);
        }

        position.actualColumns = maxSimultaneousColumns;
        position.totalColumns = columns.length;

        // positionIndexはカラム番号をそのまま使用（空いたカラムを再利用するため）
        position.positionIndex = position.column;
    });

    return eventPositions;
}