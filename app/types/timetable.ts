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
