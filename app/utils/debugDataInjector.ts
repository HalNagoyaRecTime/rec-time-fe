// === デバッグ用データ注入ユーティリティ ===
import { STORAGE_KEYS } from "~/constants/storage";

/**
 * モックJSONデータをLocalStorageに注入
 */
export async function injectMockData(mockType: "default" | "overlap" = "default"): Promise<boolean> {
    try {
        const mockFileName = mockType === "default" ? "/timetable-mock.json" : "/timetable-mock-overlap-test.json";

        // モックJSONを取得
        const response = await fetch(mockFileName);
        if (!response.ok) {
            console.error("[Debug] Mock JSON fetch failed:", response.status);
            return false;
        }

        const mockEvents = await response.json();

        // デバッグ用学籍番号
        const debugStudentId = "DEBUG_USER";

        // LocalStorageに保存
        localStorage.setItem(STORAGE_KEYS.STUDENT_ID, debugStudentId);
        localStorage.setItem(STORAGE_KEYS.EVENTS(debugStudentId), JSON.stringify(mockEvents));
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());

        console.log("[Debug] Mock data injected successfully:", mockEvents);

        // ページをリロードしてデータを反映
        window.location.reload();

        return true;
    } catch (error) {
        console.error("[Debug] Failed to inject mock data:", error);
        return false;
    }
}