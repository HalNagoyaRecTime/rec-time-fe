// === キャッシュクリアユーティリティ ===
// === 캐시 클리어 유틸리티 ===

import { STORAGE_KEYS } from "~/constants/storage";

/**
 * すべてのアプリケーションデータを削除
 * - LocalStorage
 * - IndexedDB
 * - Service Worker通知スケジュール
 */
export async function clearAllCache(): Promise<void> {
    try {
        console.log("[clearCache] キャッシュクリア開始...");

        // 1. LocalStorageの削除
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
        localStorage.removeItem("notification:enabled");
        localStorage.removeItem("notification:notified_events");
        localStorage.removeItem("notification:last_reset_date");

        console.log("[clearCache] ✅ LocalStorageをクリアしました");

        // 2. IndexedDBの削除（Service Worker用の通知スケジュール）
        try {
            const DB_NAME = "RecTimeNotificationsDB";
            await new Promise<void>((resolve, reject) => {
                const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
                deleteRequest.onsuccess = () => {
                    console.log("[clearCache] ✅ IndexedDB (通知スケジュール) を削除しました");
                    resolve();
                };
                deleteRequest.onerror = () => {
                    console.warn("[clearCache] ⚠️  IndexedDB削除エラー:", deleteRequest.error);
                    resolve(); // エラーでも続行
                };
                deleteRequest.onblocked = () => {
                    console.warn("[clearCache] ⚠️  IndexedDB削除がブロックされました");
                    resolve(); // ブロックされても続行
                };
            });
        } catch (error) {
            console.warn("[clearCache] IndexedDB削除エラー:", error);
        }

        // 3. Service Workerに通知停止を通知
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: "STOP_NOTIFICATIONS",
            });
            console.log("[clearCache] ✅ Service Workerに通知停止を送信しました");
        }

        console.log("[clearCache] ✅ すべてのキャッシュを削除しました");
    } catch (error) {
        console.error("[clearCache] キャッシュ削除エラー:", error);
        throw error;
    }
}