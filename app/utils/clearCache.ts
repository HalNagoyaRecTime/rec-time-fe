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

        // 2. IndexedDBの削除（Service Worker用の通知スケジュール）
        try {
            const DB_NAME = "RecTimeNotificationsDB";
            await new Promise<void>((resolve, reject) => {
                const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
                deleteRequest.onsuccess = () => {
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
        }
    } catch (error) {
        console.error("[clearCache] キャッシュ削除エラー:", error);
        throw error;
    }
}

/**
 * PWAを完全に再インストール（疑似的）
 * - Service Workerのすべてのキャッシュを削除
 * - Service Workerをアンインストール
 * - ページをリロードして自動再登録
 */
export async function reinstallPWA(): Promise<void> {
    try {
        // 1. Service Workerのすべてのキャッシュを削除
        if ("caches" in window) {
            const cacheNames = await caches.keys();

            await Promise.all(
                cacheNames.map(async (cacheName) => {
                    const deleted = await caches.delete(cacheName);
                    if (deleted) {
                    }
                })
            );
        }

        // 2. Service Workerをアンインストール
        if ("serviceWorker" in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();

            await Promise.all(
                registrations.map(async (registration) => {
                    const unregistered = await registration.unregister();
                    if (unregistered) {
                    }
                })
            );
        }

        // 3. IndexedDBも念のため削除
        try {
            const DB_NAME = "RecTimeNotificationsDB";
            await new Promise<void>((resolve) => {
                const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
                deleteRequest.onsuccess = () => {
                    resolve();
                };
                deleteRequest.onerror = () => {
                    console.warn("[reinstallPWA] ⚠️  IndexedDB削除エラー");
                    resolve();
                };
                deleteRequest.onblocked = () => {
                    console.warn("[reinstallPWA] ⚠️  IndexedDB削除がブロックされました");
                    resolve();
                };
            });
        } catch (error) {
            console.warn("[reinstallPWA] IndexedDB削除エラー:", error);
        }

        // 4. 再インストール完了フラグを保存（リロード後に表示するため）
        localStorage.setItem("app:update_completed", "true");

        // 5. 少し待ってからリロード（確実にアンインストールが完了するのを待つ）
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 6. ページをリロード（Service Workerが自動で再登録される）
        window.location.reload();
    } catch (error) {
        console.error("[reinstallPWA] ❌ PWA再インストールエラー:", error);
        throw error;
    }
}
