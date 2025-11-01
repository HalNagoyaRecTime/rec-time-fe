// === データ取得・保存ユーティリティ ===
// === 데이터 취득・보존 유틸리티 ===
import { fetchByGakuseki } from "~/api/student";
import type { EventRow } from "~/api/student";
import { STORAGE_KEYS } from "~/constants/storage";
import { getDataUpdateCount, updateLastDataUpdateCount } from "~/utils/dataUpdateChecker";

// === 学籍番号取得 ===
// === 학번 취득 ===
export function getStudentId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.STUDENT_ID);
}

// === 学籍番号保存 ===
// === 학번 보존 ===
export function setStudentId(id: string) {
    localStorage.setItem(STORAGE_KEYS.STUDENT_ID, id);
}

// === データ更新イベントを発火 ===
// === 데이터 갱신 이벤트 발화 ===
function dispatchDataUpdatedEvent() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("data-updated"));
    }
}

// === イベントデータ取得・保存 ===
// === 이벤트 데이터 취득・보존 ===
export async function downloadAndSaveEvents(
    id: string | null = getStudentId(),
    skipUpdateCheck: boolean = false // true=初回ロード時（チェックスキップ）、false=useAppStateSync経由（直接取得）
): Promise<{ success: boolean; events: EventRow[]; isFromCache: boolean }> {
    try {
        // skipUpdateCheck の意味：
        // - true: 初回ロード時（チェック不要、直接取得）
        // - false: useAppStateSync経由（カウント既に更新済みなので直接取得）
        // どちらのケースでも、ここではチェック不要で常にAPIから取得

        // /api/events でフル取得
        console.log("[dataFetcher] APIから完全なイベントを取得中");
        const result = await fetchByGakuseki(id);
        const payload = result.payload;
        const isFromCache = result.isFromCache;

        // LocalStorageに保存（常に保存）
        const storageKey = id ? STORAGE_KEYS.EVENTS(id) : STORAGE_KEYS.EVENTS("guest");
        localStorage.setItem(storageKey, JSON.stringify(payload.t_events));

        // オンライン取得時のみ更新
        if (!isFromCache) {
            const now = new Date();
            const iso = now.toISOString();
            localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, iso);

            // 初回ロード時のみ件数を記録
            if (skipUpdateCheck) {
                // 初回ロード時：件数を取得して記録
                const currentCount = await getDataUpdateCount();
                if (currentCount !== -1) {
                    updateLastDataUpdateCount(currentCount);
                }
            }
            // falseの場合（useAppStateSync経由）は、useAppStateSync側で既に件数を記録済み

            // データ更新イベントを発火
            dispatchDataUpdatedEvent();
        }

        return { success: true, events: payload.t_events, isFromCache };
    } catch (e) {
        console.error("[dataFetcher] 実行失敗:", e instanceof Error ? e.message : String(e));

        // オフライン時はLocalStorageからフォールバック
        const storageKey = id ? STORAGE_KEYS.EVENTS(id) : STORAGE_KEYS.EVENTS("guest");
        const cachedData = localStorage.getItem(storageKey);
        if (cachedData) {
            try {
                const events = JSON.parse(cachedData);
                return { success: true, events, isFromCache: true };
            } catch (parseError) {
                console.error("[dataFetcher] キャッシュデータのパースエラー:", parseError);
            }
        }

        return { success: false, events: [], isFromCache: false };
    }
}

// === 最終更新時間取得 ===
// === 최종 갱신 시간 취득 ===
export function getLastUpdatedTime(): Date | null {
    const iso = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
    if (!iso) return null;
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return null;
    return new Date(t);
}

// === 最終更新時間の表示用文字列取得 ===
// === 최종 갱신 시간 표시용 문자열 취득 ===
export function getLastUpdatedDisplay(locale: string = "ja-JP"): string | null {
    const time = getLastUpdatedTime();
    if (!time) return null;
    return time.toLocaleString(locale);
}
