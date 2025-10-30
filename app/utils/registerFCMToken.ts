/**
 * FCM 토큰 등록 유틸리티
 * FCMトークン登録ユーティリティ
 */

import { getApiBaseUrl } from "~/config/apiConfig";

export interface FCMTokenData {
    token: string;
    studentNum: string;
    timestamp: string;
    deviceInfo?: {
        userAgent: string;
        platform: string;
        language: string;
    };
}

/**
 * FCM 토큰을 백엔드에 등록 / FCMトークンをバックエンドに登録
 * @param token FCM 토큰 / FCMトークン
 * @param studentNum 학번 / 学籍番号
 * @returns Promise<boolean> 등록 성공 여부 / 登録成功可否
 */
export async function registerFCMToken(token: string, studentNum: string): Promise<boolean> {
    try {
        const API_BASE = getApiBaseUrl();
        const apiUrl = `${API_BASE}/fcm/register`;

        const tokenData: FCMTokenData = {
            token,
            studentNum,
            timestamp: new Date().toISOString(),
            deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
            },
        };

        console.log("📤 FCM 토큰 등록 시작 / FCMトークン登録開始:", {
            studentNum,
            tokenPreview: token.substring(0, 20) + "...",
            apiUrl,
        });

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(tokenData),
        });

        if (!response.ok) {
            console.error(`❌ FCM 토큰 등록 실패 / FCMトークン登録失敗: ${response.status}`);
            const errorText = await response.text();
            console.error("에러 상세 / エラー詳細:", errorText);
            return false;
        }

        const result = await response.json();
        console.log("✅ FCM 토큰 등록 성공 / FCMトークン登録成功:", result);
        return true;
    } catch (error) {
        console.error("❌ FCM 토큰 등록 중 에러 / FCMトークン登録中エラー:", error);
        return false;
    }
}

/**
 * FCM 토큰 등록 상태 확인 / FCMトークン登録状態確認
 * @param studentNum 학번 / 学籍番号
 * @returns Promise<boolean> 등록 상태 / 登録状態
 */
export async function checkFCMTokenStatus(studentNum: string): Promise<boolean> {
    try {
        const API_BASE = getApiBaseUrl();
        const apiUrl = `${API_BASE}/fcm/status/${studentNum}`;

        const response = await fetch(apiUrl, {
            method: "GET",
            cache: "no-store",
        });

        if (!response.ok) {
            console.warn(`⚠️ FCM 상태 확인 실패 / FCM状態確認失敗: ${response.status}`);
            return false;
        }

        const result = await response.json();
        console.log("📊 FCM 상태 확인 / FCM状態確認:", result);
        return result.registered || false;
    } catch (error) {
        console.error("❌ FCM 상태 확인 중 에러 / FCM状態確認中エラー:", error);
        return false;
    }
}

/**
 * FCM 토큰 삭제 / FCMトークン削除
 * @param studentNum 학번 / 学籍番号
 * @returns Promise<boolean> 삭제 성공 여부 / 削除成功可否
 */
export async function unregisterFCMToken(studentNum: string): Promise<boolean> {
    try {
        const API_BASE = getApiBaseUrl();
        const apiUrl = `${API_BASE}/fcm/unregister/${studentNum}`;

        console.log("🗑️ FCM 토큰 삭제 시작 / FCMトークン削除開始:", { studentNum, apiUrl });

        const response = await fetch(apiUrl, {
            method: "DELETE",
        });

        if (!response.ok) {
            console.error(`❌ FCM 토큰 삭제 실패 / FCMトークン削除失敗: ${response.status}`);
            return false;
        }

        console.log("✅ FCM 토큰 삭제 성공 / FCMトークン削除成功");
        return true;
    } catch (error) {
        console.error("❌ FCM 토큰 삭제 중 에러 / FCMトークン削除中エラー:", error);
        return false;
    }
}

/**
 * FCM 토큰 테스트 전송 / FCMトークンテスト送信
 * @param studentNum 학번 / 学籍番号
 * @returns Promise<boolean> 테스트 성공 여부 / テスト成功可否
 */
export async function testFCMPush(studentNum: string): Promise<boolean> {
    try {
        const API_BASE = getApiBaseUrl();
        const apiUrl = `${API_BASE}/fcm/test-push/${studentNum}`;

        console.log("🧪 FCM 테스트 전송 시작 / FCMテスト送信開始:", { studentNum, apiUrl });

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: "🧪 테스트 알림",
                body: "FCM 푸시 알림이 정상적으로 작동합니다!",
                timestamp: new Date().toISOString(),
            }),
        });

        if (!response.ok) {
            console.error(`❌ FCM 테스트 전송 실패 / FCMテスト送信失敗: ${response.status}`);
            return false;
        }

        const result = await response.json();
        console.log("✅ FCM 테스트 전송 성공 / FCMテスト送信成功:", result);
        return true;
    } catch (error) {
        console.error("❌ FCM 테스트 전송 중 에러 / FCMテスト送信中エラー:", error);
        return false;
    }
}
