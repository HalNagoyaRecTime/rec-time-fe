/**
 * Firebase 설정 및 FCM 초기화
 * Firebase設定とFCM初期化
 */

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, type MessagePayload } from "firebase/messaging";

// Firebase 설정 / Firebase設定
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAUDY7ty75NHqwfmT4xGiTeJj3f5VT0Duc",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "rec-time-593b0.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rec-time-593b0",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rec-time-593b0.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "885151050655",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:885151050655:web:873c0e58da98316a4fabaa",
};

// Firebase 앱 초기화 / Firebaseアプリ初期化
let app: any = null;
let messaging: any = null;
let isInitialized = false;

/**
 * Firebase 초기화 (遅延初期化)
 */
function ensureFirebaseInitialized() {
    if (isInitialized) return;
    
    // 브라우저 환境에서만 Firebase 초기化
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        try {
            app = initializeApp(firebaseConfig);
            messaging = getMessaging(app);
            isInitialized = true;
            console.log("✅ Firebase 초기화 성공 / Firebase初期化成功");
        } catch (error) {
            console.warn("⚠️ Firebase 초기화 실패 - FCM 기능 비활성화 / Firebase初期化失敗 - FCM機能無効化:", error);
        }
    }
}

export { messaging };

// VAPID 키 (Firebase Console에서 생성) / VAPIDキー（Firebase Consoleで生成）
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BDsQckrzvpH4ugFGqmP3Ossqg8CMldK86GdhQ4M1KCugkDzEe0SS7xFftinDSt4GYYKqxGkOakEsKD5p2GlaBgs";

/**
 * FCM 토큰 가져오기 / FCMトークン取得
 * @returns Promise<string | null> FCM 토큰 또는 null / FCMトークンまたはnull
 */
export async function getFCMToken(): Promise<string | null> {
    try {
        // Firebase 초기化確保
        ensureFirebaseInitialized();
        
        if (!messaging) {
            console.warn("⚠️ Firebase가 초기화되지 않았습니다 / Firebaseが初期化されていません");
            return null;
        }

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

        // Service Worker 등록 대기
        const registration = await navigator.serviceWorker.ready;
        console.log("✅ Service Worker 준비 완료 / Service Worker準備完了");

        // FCM 토큰 발급 / FCMトークン発行
        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
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
        // Firebase 初期化確保
        ensureFirebaseInitialized();
        
        if (!messaging) {
            console.warn("⚠️ Firebase가 초기화되지 않았습니다 / Firebaseが初期化されていません");
            return;
        }

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

/**
 * FCM 초기화 함수 / FCM初期化関数
 * @returns Promise<boolean> 초기화 성공 여부 / 初期化成功可否
 */
export async function initializeFCM(): Promise<boolean> {
    try {
        if (!("Notification" in window)) {
            console.warn("⚠️ 이 브라우저는 알림을 지원하지 않습니다 / このブラウザは通知をサポートしていません");
            return false;
        }

        // FCM 메시지 리스너 설정 / FCMメッセージリスナー設定
        setupFCMListener();
        
        console.log("✅ FCM 초기화 완료 / FCM初期化完了");
        return true;
    } catch (error) {
        console.error("❌ FCM 초기화 실패 / FCM初期化失敗:", error);
        return false;
    }
}