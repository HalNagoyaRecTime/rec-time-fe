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
import { initializeFCM } from "~/utils/firebaseConfig";
import { registerFCMToken } from "~/utils/registerFCMToken";
import { getFCMToken } from "~/utils/firebaseConfig";
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

            // FCM 초기화 및 토큰 등록 시도
            try {
                // FCM 초기화
                const fcmInitialized = await initializeFCM();
                if (fcmInitialized) {
                    console.log("[useNotificationSettings] FCM 초기화 성공 - 오프라인 알림 활성화");
                    
                    // FCM 토큰 발급 및 백엔드 등록
                    const studentId = localStorage.getItem(STORAGE_KEYS.STUDENT_ID);
                    if (studentId) {
                        const token = await getFCMToken();
                        if (token) {
                            const success = await registerFCMToken(token, studentId);
                            if (success) {
                                console.log("[useNotificationSettings] FCM 토큰 등록 성공");
                            } else {
                                console.warn("[useNotificationSettings] FCM 토큰 등록 실패");
                            }
                        }
                    }
                } else {
                    console.log("[useNotificationSettings] FCM 초기화 실패 - 기존 Service Worker 방식 사용");
                }
            } catch (error) {
                console.error("[useNotificationSettings] FCM 초기화 오류:", error);
            }

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

            // 注意喚起を表示するフラグを設定
            localStorage.setItem("notification:should_show_warning", "true");

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