// === キャッシュクリアユーティリティ ===
// === 캐시 클리어 유틸리티 ===

import { STORAGE_KEYS } from "~/constants/storage";

/**
 * すべてのアプリケーションデータをLocalStorageから削除
 * 모든 애플리케이션 데이터를 LocalStorage에서 삭제
 */
export function clearAllCache(): void {
    try {
        // 学生IDを取得（イベントデータのキー削除に必要）
        const studentId = localStorage.getItem(STORAGE_KEYS.STUDENT_ID);

        // 学生情報の削除
        localStorage.removeItem(STORAGE_KEYS.STUDENT_ID);
        localStorage.removeItem(STORAGE_KEYS.STUDENT_DATA);
        localStorage.removeItem(STORAGE_KEYS.STUDENT_BIRTHDAY);
        localStorage.removeItem(STORAGE_KEYS.STUDENT_NAME);

        // イベント情報の削除
        if (studentId) {
            localStorage.removeItem(STORAGE_KEYS.EVENTS(studentId));
            localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS(studentId));
            localStorage.removeItem(STORAGE_KEYS.UPDATES(studentId));
        }
        localStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);

        // 通知設定の削除
        localStorage.removeItem(STORAGE_KEYS.NOTIFICATION_ENABLED);

        console.log("[clearCache] すべてのキャッシュを削除しました");
    } catch (error) {
        console.error("[clearCache] キャッシュ削除エラー:", error);
        throw error;
    }
}