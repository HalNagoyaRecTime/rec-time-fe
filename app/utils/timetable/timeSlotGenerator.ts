// === タイムスロット生成関数 ===
import type { TimeSlot } from "~/types/timetable";

/**
 * 指定された時間範囲でタイムスロットを生成
 * @param startHour - 開始時刻（時）
 * @param endHour - 終了時刻（時）
 * @param intervalMinutes - 間隔（分）
 * @returns タイムスロット配列
 */
export function generateTimeSlots(startHour: number, endHour: number, intervalMinutes: number = 15): TimeSlot[] {
    const slots: TimeSlot[] = [];

    for (let hour = startHour; hour <= endHour; hour++) {
        for (let minute = 0; minute < 60; minute += intervalMinutes) {
            const timeValue = hour * 100 + minute;
            const displayTime = `${hour}:${minute.toString().padStart(2, "0")}`;
            slots.push({ value: timeValue, display: displayTime });
        }
    }

    return slots;
}