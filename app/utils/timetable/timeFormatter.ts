// === 時刻フォーマット関数 ===

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
 * 開始時刻と継続時間から終了時刻を計算
 * @param startTime - 開始時刻 ("0930" 形式)
 * @param duration - 継続時間（分）
 * @returns 終了時刻 ("1030" 形式)
 */
export function calculateEndTime(startTime: string | null, duration: string | null): string {
    if (!startTime || !duration) return "";

    const startHour = parseInt(startTime.substring(0, 2), 10);
    const startMinute = parseInt(startTime.substring(2, 4), 10);
    const durationMinutes = parseInt(duration, 10);

    const totalMinutes = startHour * 60 + startMinute + durationMinutes;
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;

    return `${endHour.toString().padStart(2, "0")}${endMinute.toString().padStart(2, "0")}`;
}

/**
 * 開始時刻と終了時刻を "HH:MM~HH:MM" 形式にフォーマット
 * @param startTime - 開始時刻 ("0930" 形式)
 * @param duration - 継続時間（分）
 * @returns "9:30~10:30" 形式の文字列
 */
export function formatTimeRange(startTime: string | null, duration: string | null): string {
    if (!startTime || !duration) return "";

    const start = formatTime(startTime);
    const end = formatTime(calculateEndTime(startTime, duration));

    return `${start}~${end}`;
}
