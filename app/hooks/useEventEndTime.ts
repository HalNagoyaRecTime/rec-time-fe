// === イベント終了時刻計算 Hook ===

import { useMemo } from "react";

/**
 * イベントの終了時刻を計算する hook
 * @param startTime - 開始時刻（HHmm形式、例："1430"）
 * @param duration - 継続時間（分、例："90"）
 * @returns 終了時刻（HHmm形式の文字列と数値）
 */
export function useEventEndTime(
  startTime: string | null | undefined,
  duration: string | null | undefined
) {
  return useMemo(() => {
    if (!startTime || !duration) {
      return {
        endTimeString: "",
        endTimeNumber: 0,
      };
    }

    const startHour = Math.floor(parseInt(startTime, 10) / 100);
    const startMinute = parseInt(startTime, 10) % 100;
    const durationMinutes = parseInt(duration, 10);

    const totalMinutes = startHour * 60 + startMinute + durationMinutes;
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;

    const endTimeString = `${endHour.toString().padStart(2, "0")}${endMinute
      .toString()
      .padStart(2, "0")}`;
    const endTimeNumber = endHour * 100 + endMinute;

    return {
      endTimeString,
      endTimeNumber,
    };
  }, [startTime, duration]);
}
