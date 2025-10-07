// === LocalStorageからイベントデータを読み込むユーティリティ ===
// === LocalStorage에서 이벤트 데이터를 읽어오는 유틸리티 ===
import type { EventRow } from "../api/student";

const LS_KEY_ID = "student:id";
const LS_KEY_EVENTS = (id: string) => `events:list:${id}`;

// === LocalStorageからイベントデータを読み込む ===
// === LocalStorage에서 이벤트 데이터 읽어오기 ===
export function loadEventsFromStorage(studentId: string | null): EventRow[] {
    try {
        // 学籍番号がある場合はユーザー専用キーから読み込み
        if (studentId) {
            const eventsData = localStorage.getItem(LS_KEY_EVENTS(studentId));
            if (eventsData) {
                const events = JSON.parse(eventsData);
                return Array.isArray(events) ? events : [];
            }
        }

        return [];
    } catch (error) {
        console.error("[loadEventsFromStorage] イベントデータの読み込みエラー:", error);
        return [];
    }
}