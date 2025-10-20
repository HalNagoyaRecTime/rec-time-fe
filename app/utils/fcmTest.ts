// FCM 테스트 유틸리티
// FCMテストユーティリティ

import { getFCMToken } from "./firebaseConfig";

/**
 * FCM 토큰 테스트
 * FCMトークンテスト
 */
export async function testFCMToken(): Promise<void> {
    console.log("[FCM Test] 토큰 테스트 시작");
    
    try {
        const token = await getFCMToken();
        if (token) {
            console.log("[FCM Test] ✅ 토큰 발급 성공:", token);
            
            // 토큰을 클립보드에 복사
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(token);
                console.log("[FCM Test] ✅ 토큰이 클립보드에 복사되었습니다");
            }
        } else {
            console.log("[FCM Test] ❌ 토큰 발급 실패");
        }
    } catch (error) {
        console.error("[FCM Test] ❌ 토큰 테스트 오류:", error);
    }
}

/**
 * FCM 알림 테스트 (백엔드 API 호출)
 * FCM通知テスト（バックエンドAPI呼び出し）
 * 
 * 역할: 백엔드에서 FCM 푸시 알림을 보내서 기존 Service Worker 알림과
 * 동일한 형태로 표시되는지 테스트
 */
export async function testFCMPush(): Promise<void> {
    console.log("[FCM Test] 푸시 알림 테스트 시작");
    
    try {
        const response = await fetch("/api/push", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: "【予定】テストイベント",
                body: "FCMプッシュ通知が正常に動作しています！",
                data: {
                    test: "true",
                    timestamp: new Date().toISOString(),
                },
            }),
        });

        if (response.ok) {
            const result = await response.json();
            console.log("[FCM Test] ✅ 푸시 알림 전송 성공:", result);
        } else {
            console.error("[FCM Test] ❌ 푸시 알림 전송 실패:", response.status);
        }
    } catch (error) {
        console.error("[FCM Test] ❌ 푸시 알림 테스트 오류:", error);
    }
}

// 임시 테스트용: 프로덕션에서도 테스트 가능하도록 전역 등록
// ⚠️ 실제 배포 후에는 이 부분을 제거해야 합니다 (보안상 이유)
(window as any).testFCMToken = testFCMToken;
(window as any).testFCMPush = testFCMPush;

console.log("[FCM Test] 테스트 함수가 등록되었습니다:");
console.log("- testFCMToken(): FCM 토큰 발급 테스트");
console.log("- testFCMPush(): FCM 푸시 알림 테스트 (기존 알림과 동일한 형태)");
console.log("⚠️ 이 함수들은 테스트용입니다. 실제 배포 시 제거 예정");
