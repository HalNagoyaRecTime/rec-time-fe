/**
 * Firebase 설정 및 FCM 초기화
 * Firebase設定とFCM初期化
 */

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, MessagePayload } from "firebase/messaging";

// Firebase 설정 / Firebase設定
const firebaseConfig = {
    apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // 실제 키로 교체 필요 / 実際のキーに置き換え必要
    authDomain: "rec-time-593b0.firebaseapp.com",
    projectId: "rec-time-593b0",
    storageBucket: "rec-time-593b0.appspot.com",
    messagingSenderId: "123456789012", // 실제 ID로 교체 필요 / 実際のIDに置き換え必要
    appId: "1:123456789012:web:abcdef1234567890", // 실제 ID로 교체 필요 / 実際のIDに置き換え必要
};

// Firebase 앱 초기화 / Firebaseアプリ初期化
const app = initializeApp(firebaseConfig);

// FCM 메시징 인스턴스 / FCMメッセージングインスタンス
export const messaging = getMessaging(app);

// VAPID 키 (Firebase Console에서 생성) / VAPIDキー（Firebase Consoleで生成）
const VAPID_KEY = "BXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"; // 실제 키로 교체 필요 / 実際のキーに置き換え必要

/**
 * FCM 토큰 가져오기 / FCMトークン取得
 * @returns Promise<string | null> FCM 토큰 또는 null / FCMトークンまたはnull
 */
export async function getFCMToken(): Promise<string | null> {
    try {
        if (!("Notification" in window)) {
            console.warn("⚠️ 이 브라우저는 알림을 지원하지 않습니다 / このブラウザは通知をサポートしていません");
            return null;
        }

        // 알림 권한 요청 / 通知権限リクエスト
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("⚠️ 알림 권한이 거부되었습니다 / 通知権限が拒否されました");
            return null;
        }

        // FCM 토큰 발급 / FCMトークン発行
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
        });

        if (token) {
            console.log("✅ FCM 토큰 발급 성공 / FCMトークン発行成功:", token.substring(0, 20) + "...");
            return token;
        } else {
            console.warn("⚠️ FCM 토큰을 가져올 수 없습니다 / FCMトークンを取得できません");
            return null;
        }
    } catch (error) {
        console.error("❌ FCM 토큰 발급 실패 / FCMトークン発行失敗:", error);
        return null;
    }
}

/**
 * FCM 메시지 수신 리스너 설정 / FCMメッセージ受信リスナー設定
 * @param onMessageCallback 메시지 수신 시 콜백 함수 / メッセージ受信時コールバック関数
 */
export function setupFCMListener(onMessageCallback?: (payload: MessagePayload) => void) {
    try {
        onMessage(messaging, (payload) => {
            console.log("🔔 FCM 메시지 수신 / FCMメッセージ受信:", payload);
            
            // 기본 알림 표시 / デフォルト通知表示
            if (payload.notification) {
                new Notification(payload.notification.title || "알림", {
                    body: payload.notification.body || "",
                    icon: payload.notification.icon || "/icons/pwa-192.png",
                });
            }
            
            // 커스텀 콜백 실행 / カスタムコールバック実行
            if (onMessageCallback) {
                onMessageCallback(payload);
            }
        });
        
        console.log("✅ FCM 리스너 설정 완료 / FCMリスナー設定完了");
    } catch (error) {
        console.error("❌ FCM 리스너 설정 실패 / FCMリスナー設定失敗:", error);
    }
}

/**
 * FCM 토큰 새로고침 / FCMトークンリフレッシュ
 * @returns Promise<string | null> 새로운 FCM 토큰 / 新しいFCMトークン
 */
export async function refreshFCMToken(): Promise<string | null> {
    try {
        const token = await getFCMToken();
        if (token) {
            console.log("🔄 FCM 토큰 새로고침 완료 / FCMトークンリフレッシュ完了");
        }
        return token;
    } catch (error) {
        console.error("❌ FCM 토큰 새로고침 실패 / FCMトークンリフレッシュ失敗:", error);
        return null;
    }
}