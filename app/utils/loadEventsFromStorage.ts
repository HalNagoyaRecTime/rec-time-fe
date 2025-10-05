// === LocalStorageからイベントデータを読み込むユーティリティ ===
// === LocalStorage에서 이벤트 데이터를 읽어오는 유틸리티 ===
import type { EventRow } from "../api/student";

const LS_KEY_ID = "student:id";
const LS_KEY_EVENTS = (id: string) => `events:list:${id}`;

// === LocalStorageからイベントデータを読み込む ===
// === LocalStorage에서 이벤트 데이터 읽어오기 ===
export function loadEventsFromStorage(studentId: string | null): EventRow[] {
    if (!studentId) return [];

    try {
        const eventsData = localStorage.getItem(LS_KEY_EVENTS(studentId));
        if (!eventsData) return [];

        const events = JSON.parse(eventsData);
        return Array.isArray(events) ? events : [];
    } catch (error) {
        console.error("[loadEventsFromStorage] イベントデータの読み込みエラー:", error);
        return [];
    }
}