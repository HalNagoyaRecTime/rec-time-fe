// === タイムテーブル関連の型定義 ===

/**
 * メッセージタイプ
 */
export type MessageType = "success" | "error" | null;

/**
 * メッセージ
 */
export interface Message {
    type: MessageType;
    content: string;
}

/**
 * タイムスロット
 */
export interface TimeSlot {
    value: number; // HHmm形式の数値 (例: 930 = 9:30)
    display: string; // 表示用文字列 (例: "9:30")
}

/**
 * イベントレイアウト情報
 */
export interface EventLayout {
    top: number; // 上端位置 (px)
    height: number; // 高さ (px)
    column: number; // カラムインデックス
    totalColumns: number; // 総カラム数
    actualColumns: number; // 実際に重複しているイベント数
    positionIndex: number; // 重複グループ内での位置インデックス
}

/**
 * イベント時間範囲
 */
export interface EventTimeRange {
    start: number; // 開始時刻 (HHmm形式)
    end: number; // 終了時刻 (HHmm形式)
}

/**
 * タイムテーブル定数
 */
export const TIMETABLE_CONSTANTS = {
    // タイムスロット設定
    START_HOUR: 9,
    DISPLAY_END_HOUR: 18.5, // 18:30まで表示（グリッド表示用）
    STOP_HOUR: 18, // 18:00で時刻バー・膜を停止
    SLOT_INTERVAL_MINUTES: 5, // 5分間隔
    SLOT_HEIGHT_PX: 8, // 5分あたり8px (1時間 = 12スロット × 8px = 96px)
    HOUR_HEIGHT_PX: 96, // 1時間 = 12スロット × 8px

    // イベント表示設定
    MAX_VISIBLE_EVENTS: 6,
    MIN_EVENT_WIDTH_PX: 60,
    EVENT_HEIGHT_MARGIN_PX: 2,

    // 時間軸設定
    TIME_LABEL_WIDTH_PX: 48, // w-12 = 48px
} as const;