// === イベント重なり検出・レイアウト計算 ===
import type { EventRow } from "~/api/student";
import type { EventLayout, EventTimeRange } from "~/types/timetable";
import { TIMETABLE_CONFIG } from "~/config/timetableConfig";

const { START_HOUR, SLOT_HEIGHT_PX, SLOTS_PER_HOUR } = TIMETABLE_CONFIG;

/**
 * イベントの長さをスロット単位で計算（最小1スロット）
 */
function getEventDurationUnits(event: EventRow): number {
    if (!event.f_start_time || !event.f_duration) return 0;
    const durationMinutes = parseInt(event.f_duration, 10);
    const slotIntervalMinutes = 60 / SLOTS_PER_HOUR;
    // 1スロット未満は1スロットに切り上げ
    const adjustedDuration = Math.max(durationMinutes, slotIntervalMinutes);
    return Math.ceil(adjustedDuration / slotIntervalMinutes);
}

/**
 * イベントの重なりを検出し、レイアウト情報を計算
 * @param events - イベント配列
 * @returns イベントIDとレイアウト情報のMap
 */
export function calculateEventLayout(events: EventRow[]): Map<string, EventLayout> {
    const eventPositions = new Map<string, EventLayout>();
    const slotIntervalMinutes = 60 / SLOTS_PER_HOUR;
    
    console.log(`[eventLayoutCalculator] 레이아웃 계산 시작 - 전체 이벤트: ${events.length}개`);
    console.log(`[eventLayoutCalculator] 이벤트 목록:`, events.map(e => ({
        id: e.f_event_id,
        name: e.f_event_name,
        start: e.f_start_time,
        duration: e.f_duration,
        isMyEntry: e.f_is_my_entry
    })));

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
        if (!event.f_start_time) {
            console.warn(`[eventLayoutCalculator] 이벤트 ${event.f_event_name} (${event.f_event_id}) - 시작 시간 없음, 스킵`);
            return;
        }

        const startTime = parseInt(event.f_start_time, 10);
        console.log(`[eventLayoutCalculator] 이벤트 ${event.f_event_name} - 시작: ${startTime}, 참가: ${event.f_is_my_entry}`);
        const startHours = Math.floor(startTime / 100);
        const startMinutes = startTime % 100;
        const startTotalMinutes = startHours * 60 + startMinutes;
        const baseMinutes = START_HOUR * 60; // 開始時刻基準
        const eventStartUnits = Math.floor((startTotalMinutes - baseMinutes) / slotIntervalMinutes);

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
            height: getEventDurationUnits(event) * SLOT_HEIGHT_PX,
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

        // イベント期間をスロット間隔でスキャンして、各時点での同時存在イベント数を数える
        const startMinutes = Math.floor(timeRange.start / 100) * 60 + (timeRange.start % 100);
        const endMinutes = Math.floor(timeRange.end / 100) * 60 + (timeRange.end % 100);

        for (let minute = startMinutes; minute < endMinutes; minute += slotIntervalMinutes) {
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

    console.log(`[eventLayoutCalculator] 레이아웃 계산 완료 - 표시 가능한 이벤트: ${eventPositions.size}개`);
    return eventPositions;
}