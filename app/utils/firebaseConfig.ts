// Firebase 설정 파일
// Firebase 설정 파일

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase 설정값
const firebaseConfig = {
  apiKey: "AIzaSyAUDY7ty75NHqwfmT4xGiTeJj3f5VT0Duc",
  authDomain: "rec-time-593b0.firebaseapp.com",
  projectId: "rec-time-593b0",
  storageBucket: "rec-time-593b0.firebasestorage.app",
  messagingSenderId: "885151050655",
  appId: "1:885151050655:web:873c0e58da98316a4fabaa",
  measurementId: "G-5YRL3CV57Z"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// FCM 메시징 인스턴스
let messaging: any = null;

// 브라우저 환경에서만 메시징 초기화
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn("[FCM] 메시징 초기화 실패:", error);
  }
}

// VAPID 키 (웹 푸시 인증서)
const VAPID_KEY = "BD3y9p2gY1xpk5cTBCw6C_zt0UAU0ylAUSkbtY462tR7b7JACVtSvz9zu5bXuoFZNAXxmSrcfCWLMa6nDiZeVso";

/**
 * FCM 토큰 발급
 * FCM 토큰発行
 */
export async function getFCMToken(): Promise<string | null> {
  if (!messaging) {
    console.warn("[FCM] 메시징이 초기화되지 않았습니다");
    return null;
  }

  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (token) {
      console.log("[FCM] 토큰 발급 성공:", token);
      return token;
    } else {
      console.warn("[FCM] 토큰 발급 실패: 알림 권한이 필요합니다");
      return null;
    }
  } catch (error) {
    console.error("[FCM] 토큰 발급 오류:", error);
    return null;
  }
}

/**
 * FCM 토큰을 서버에 등록
 * FCMトークンをサーバーに登録
 */
export async function registerFCMToken(token: string): Promise<boolean> {
  try {
    const response = await fetch("/api/register-fcm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,
        timestamp: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      console.log("[FCM] 토큰 등록 성공");
      return true;
    } else {
      console.error("[FCM] 토큰 등록 실패:", response.status);
      return false;
    }
  } catch (error) {
    console.error("[FCM] 토큰 등록 오류:", error);
    return false;
  }
}

/**
 * FCM 메시지 수신 리스너 설정
 * FCMメッセージ受信リスナー設定
 * 
 * 역할: FCM이 백엔드에서 푸시 알림을 보낼 때 포그라운드에서 수신하여
 * 기존 Service Worker 알림과 동일한 형태로 표시
 */
export function setupFCMListener() {
  if (!messaging) {
    console.warn("[FCM] 메시징이 초기화되지 않았습니다");
    return;
  }

  // 포그라운드에서 메시지 수신 시 처리
  onMessage(messaging, (payload) => {
    console.log("[FCM] 포그라운드 메시지 수신:", payload);
    
    // 기존 Service Worker 알림과 동일한 형태로 표시
    if (payload.notification) {
      const notification = new Notification(payload.notification.title || "RecTime 通知設定", {
        body: payload.notification.body,
        icon: "/icons/pwa-192.png",
        badge: "/icons/pwa-192.png",
        tag: payload.data?.eventId || "fcm-notification",
        requireInteraction: true,
      });

      // 알림 클릭 시 앱으로 포커스
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  });
}

/**
 * FCM 초기화 및 토큰 등록
 * FCM初期化及びトークン登録
 * 
 * 역할: FCM을 초기화하여 백엔드에서 푸시 알림을 받을 수 있도록 설정
 * 실패해도 사용자는 알아채지 못함 (기존 Service Worker 방식이 백업으로 작동)
 */
export async function initializeFCM(): Promise<boolean> {
  try {
    // 알림 권한 확인
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("[FCM] 알림 권한이 거부되었습니다");
        return false;
      }
    } else if (Notification.permission === "denied") {
      console.warn("[FCM] 알림 권한이 거부되었습니다");
      return false;
    }

    // FCM 토큰 발급
    const token = await getFCMToken();
    if (!token) {
      console.warn("[FCM] 토큰 발급 실패");
      return false;
    }

    // 서버에 토큰 등록
    const registered = await registerFCMToken(token);
    if (!registered) {
      console.warn("[FCM] 토큰 등록 실패");
      return false;
    }

    // 메시지 리스너 설정
    setupFCMListener();

    console.log("[FCM] 초기화 완료");
    return true;
  } catch (error) {
    console.error("[FCM] 초기화 오류:", error);
    return false;
  }
}

export { messaging, VAPID_KEY };
