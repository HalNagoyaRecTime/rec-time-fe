// === データ更新チェッカー ===
// /api/data-update/info を使用してデータ更新状況を確認

import { getApiBaseUrl } from "~/config/apiConfig";
import { STORAGE_KEYS } from "~/constants/storage";

/**
 * /api/data-update/info から現在のデータ更新ログ件数を取得
 */
export async function getDataUpdateCount(): Promise<number> {
  try {
    const API_BASE = getApiBaseUrl();
    const response = await fetch(`${API_BASE}/data-update/info`);

    if (!response.ok) {
      console.error('[dataUpdateChecker] データ更新情報の取得に失敗:', response.status);
      return -1; // エラー時は負の値（チェック失敗を示す）
    }

    const data = await response.json();
    const currentCount = data.recordCount ?? 0;

    console.log(`[dataUpdateChecker] 現在のデータ更新ログ件数: ${currentCount}`);

    return currentCount;
  } catch (error) {
    console.error('[dataUpdateChecker] データ更新ログ件数取得エラー:', error);
    return -1; // エラー時は負の値
  }
}

/**
 * LocalStorage から最後に確認したデータ更新ログ件数を取得
 */
export function getLastStoredDataUpdateCount(): number {
  const stored = localStorage.getItem(STORAGE_KEYS.LAST_DATA_UPDATE_COUNT);
  return stored ? parseInt(stored, 10) : 0; // 初回は0
}

/**
 * LocalStorage にデータ更新ログ件数を保存
 */
export function updateLastDataUpdateCount(count: number): void {
  localStorage.setItem(STORAGE_KEYS.LAST_DATA_UPDATE_COUNT, String(count));
  console.log(`[dataUpdateChecker] LocalStorageにデータ更新ログ件数を保存: ${count}`);
}