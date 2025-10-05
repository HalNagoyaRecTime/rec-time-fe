// === データ取得・保存ユーティリティ ===
// === 데이터 취득・보존 유틸리티 ===
import { fetchByGakuseki } from "../api/student";
import type { EventRow } from "../api/student";

// === LocalStorage キー ===
// === LocalStorage 키 ===
const LS_KEY_ID = "student:id";
const LS_KEY_EVENTS = (id: string) => `events:list:${id}`;
const LS_KEY_LAST_UPDATED = "student:payload:lastUpdated";

// === 学籍番号取得 ===
// === 학번 취득 ===
export function getStudentId(): string | null {
    return localStorage.getItem(LS_KEY_ID);
}

// === 学籍番号保存 ===
// === 학번 보존 ===
export function setStudentId(id: string) {
    localStorage.setItem(LS_KEY_ID, id);
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
    id: string | null = getStudentId()
): Promise<{ success: boolean; events: EventRow[]; isFromCache: boolean }> {
    if (!id) {
        return { success: false, events: [], isFromCache: false };
    }

    try {
        const result = await fetchByGakuseki(id);
        const payload = result.payload;
        const isFromCache = result.isFromCache;

        // LocalStorageに保存
        localStorage.setItem(LS_KEY_EVENTS(id), JSON.stringify(payload.t_events));

        // オンライン取得時のみ最終更新時間を更新
        if (!isFromCache) {
            const now = new Date();
            const iso = now.toISOString();
            localStorage.setItem(LS_KEY_LAST_UPDATED, iso);

            // データ更新イベントを発火
            dispatchDataUpdatedEvent();
        }

        return { success: true, events: payload.t_events, isFromCache };
    } catch (e) {
        console.error("[dataFetcher] データ取得エラー:", e);
        return { success: false, events: [], isFromCache: false };
    }
}

// === 最終更新時間取得 ===
// === 최종 갱신 시간 취득 ===
export function getLastUpdatedTime(): Date | null {
    const iso = localStorage.getItem(LS_KEY_LAST_UPDATED);
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