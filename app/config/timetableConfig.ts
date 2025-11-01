/**
 * タイムテーブル設定ファイル
 * 表示時間、スロット間隔、サイズなどの設定を一元管理
 */

export const TIMETABLE_CONFIG = {
    // タイムスロット設定
    START_HOUR: 3, // 始まる時間（規定値：9）
    STOP_HOUR: 10, // 終わる時間+時刻バー停止位置（規定値：18）
    DISPLAY_END_HOUR: 10.5, // 表示として存在する時間（グリッド表示用）（規定値：18.5）
    SLOTS_PER_HOUR: 12, // 1時間を6分割 → 1スロット = 10分（規定値：6）
    SLOT_HEIGHT_PX: 16, // 1スロット（10分）あたり16px → 1時間 = 6 × 16 = 96px（規定値：16）

    // イベント表示設定
    MAX_VISIBLE_EVENTS: 6, // 同時重複イベント表示上限（7個以上は「+N」で表示）
    MIN_EVENT_WIDTH_PX: 60, // イベントカードの最小幅（重複時の縮小を防止）

    // コンパクト表示閾値
    COMPACT_THRESHOLD_PX: 40, // これ未満は縮小表示
    VERY_COMPACT_THRESHOLD_PX: 24, // これ未満は最小表示
} as const;
