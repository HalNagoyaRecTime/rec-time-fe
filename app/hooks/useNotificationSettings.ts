// 通知設定管理フック
// 통지 설정 관리 훅

import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "~/constants/storage";
import {
    getNotificationSetting,
    saveNotificationSetting,
    requestNotificationPermission,
    scheduleAllNotifications,
    showSettingNotification,
} from "~/utils/notifications";
import type { EventRow } from "~/api/student";

export function useNotificationSettings() {
    const [isEnabled, setIsEnabled] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>("default");

    // 初期化: 保存された設定を読み込み
    useEffect(() => {
        const enabled = getNotificationSetting();
        setIsEnabled(enabled);

        if (typeof window !== "undefined" && "Notification" in window) {
            setPermission(Notification.permission);
        }
    }, []);

    // 通知をオンにする
    const enableNotification = async (): Promise<boolean> => {
        const perm = await requestNotificationPermission();
        setPermission(perm);

        if (perm === "granted") {
            saveNotificationSetting(true);
            setIsEnabled(true);

            // 通知オン時のフィードバック
            showSettingNotification("通知をオンにしました");

            // 既存のイベントデータがあれば通知を再スケジュール
            try {
                const studentId = localStorage.getItem(STORAGE_KEYS.STUDENT_ID);
                if (studentId) {
                    const eventsData = localStorage.getItem(STORAGE_KEYS.EVENTS(studentId));
                    if (eventsData) {
                        const events: EventRow[] = JSON.parse(eventsData);
                        scheduleAllNotifications(events);
                    }
                }
            } catch (error) {
                console.error("[useNotificationSettings] イベント再スケジュールエラー:", error);
            }

            return true;
        } else {
            setIsEnabled(false);
            return false;
        }
    };

    // 通知をオフにする
    const disableNotification = () => {
        saveNotificationSetting(false);
        setIsEnabled(false);
        
        // 通知オフ時のフィードバック（権限がある場合のみ）
        if (Notification.permission === "granted") {
            showSettingNotification("通知をオフにしました");
        }
    };

    // 通知設定をトグル
    const toggleNotification = async (enabled: boolean): Promise<boolean> => {
        if (enabled) {
            return await enableNotification();
        } else {
            disableNotification();
            return true;
        }
    };

    return {
        // 状態
        isEnabled,
        permission,

        // メソッド
        enableNotification,
        disableNotification,
        toggleNotification,
    };
}