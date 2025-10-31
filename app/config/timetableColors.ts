/**
 * タイムテーブル用色設定
 * グリッド、カード、テキストなど、全ての色をここで定義
 */

export const TIMETABLE_COLORS = {
    // グリッドと時刻線
    GRID_LINE: "#020F95",
    TIME_LINE: "#111646",

    // カード背景
    CARD_BG_DARK: "#000D91",
    CARD_BG_PARTICIPANT: "#F0B208",
    CARD_TEXT_DARK: "#111646",

    // ラベル色
    LABEL_ACCENT: "#FFB400",
} as const;

export const TIMETABLE_OPACITY = {
    GRID_LINE: 0.2,
    PAST_OVERLAY: 0.1,
    CARD_BG: 0.8,
    CARD_HOVER: 0.6,
} as const;