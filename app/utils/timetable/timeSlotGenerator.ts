// === タイムスロット生成関数 ===
import type { TimeSlot } from "~/types/timetable";

/**
 * 指定された時間範囲でタイムスロットを生成
 * @param startHour - 開始時刻（時、小数可：例 18.5 = 18:30）
 * @param endHour - 終了時刻（時、小数可：例 18.5 = 18:30）
 * @param intervalMinutes - 間隔（分）
 * @returns タイムスロット配列
 */
export function generateTimeSlots(startHour: number, endHour: number, intervalMinutes: number = 15): TimeSlot[] {
    const slots: TimeSlot[] = [];

    // 終了時刻を分単位に変換
    const endHourInMinutes = Math.floor(endHour) * 60 + (endHour % 1) * 60;

    for (let hour = startHour; hour < endHour + 1; hour++) {
        for (let minute = 0; minute < 60; minute += intervalMinutes) {
            const currentTimeInMinutes = hour * 60 + minute;

            // 終了時刻を超えたら終了
            if (currentTimeInMinutes > endHourInMinutes) {
                return slots;
            }

            const timeValue = hour * 100 + minute;
            const displayTime = `${hour}:${minute.toString().padStart(2, "0")}`;
            slots.push({ value: timeValue, display: displayTime });
        }
    }

    return slots;
}