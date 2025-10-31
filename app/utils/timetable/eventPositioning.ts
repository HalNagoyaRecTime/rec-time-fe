// === イベント位置・幅計算関数 ===
import { TIMETABLE_CONFIG } from "~/config/timetableConfig";

const { MAX_VISIBLE_EVENTS, MIN_EVENT_WIDTH_PX } = TIMETABLE_CONFIG;

/**
 * イベントの最適な幅を計算
 * @param actualColumns - 実際に重複しているイベント数
 * @returns CSS width値（文字列）
 */
export function getOptimalWidth(actualColumns: number): string {
    if (actualColumns === 1) return "100%";

    const visibleColumns = Math.min(actualColumns, MAX_VISIBLE_EVENTS);
    const widthPercentage = 100 / visibleColumns; // 隙間なし

    // 最小幅を保証
    return `max(${MIN_EVENT_WIDTH_PX}px, ${widthPercentage}%)`;
}

/**
 * イベントの左位置を計算
 * @param positionIndex - 重複グループ内での位置インデックス
 * @param actualColumns - 実際に重複しているイベント数
 * @returns CSS left値（文字列）
 */
export function getOptimalLeft(positionIndex: number, actualColumns: number): string {
    const visibleColumns = Math.min(actualColumns, MAX_VISIBLE_EVENTS);

    // 表示制限を超えた場合は0を返す（後でフィルタリング）
    if (positionIndex >= MAX_VISIBLE_EVENTS) return "0";

    // 全て0%基準から配置（親要素のpaddingで余白確保）
    const leftPercentage = (positionIndex * 100) / visibleColumns;
    return `${leftPercentage}%`;
}