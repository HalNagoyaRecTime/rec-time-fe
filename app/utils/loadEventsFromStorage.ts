// === LocalStorageからイベントデータを読み込むユーティリティ ===
// === LocalStorage에서 이벤트 데이터를 읽어오는 유틸리티 ===
import type { EventRow } from "../api/student";
import { STORAGE_KEYS } from "~/constants/storage";

// === LocalStorageからイベントデータを読み込む ===
// === LocalStorage에서 이벤트 데이터 읽어오기 ===
export function loadEventsFromStorage(studentId: string | null): EventRow[] {
    try {
        // 学籍番号がある場合はユーザー専用キーから読み込み
        if (studentId) {
            const eventsData = localStorage.getItem(STORAGE_KEYS.EVENTS(studentId));
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