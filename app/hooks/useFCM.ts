/**
 * FCM 훅 - 자동 토큰 등록 및 메시지 수신
 * FCMフック - 自動トークン登録とメッセージ受信
 */

import { useEffect, useState, useCallback } from "react";
import { getFCMToken, setupFCMListener, refreshFCMToken } from "~/utils/firebaseConfig";
import { registerFCMToken, checkFCMTokenStatus, testFCMPush, unregisterFCMToken } from "~/utils/registerFCMToken";

export interface FCMStatus {
    isSupported: boolean;
    isRegistered: boolean;
    isRegistering: boolean;
    token: string | null;
    error: string | null;
}

export interface UseFCMReturn {
    // 상태 / 状態
    status: FCMStatus;
    
    // 메서드 / メソッド
    registerToken: (studentNum: string) => Promise<boolean>;
    unregisterToken: (studentNum: string) => Promise<boolean>;
    testPush: (studentNum: string) => Promise<boolean>;
    refreshToken: () => Promise<string | null>;
    checkStatus: (studentNum: string) => Promise<boolean>;
    
    // 유틸리티 / ユーティリティ
    clearError: () => void;
}

export function useFCM(): UseFCMReturn {
    const [status, setStatus] = useState<FCMStatus>({
        isSupported: false,
        isRegistered: false,
        isRegistering: false,
        token: null,
        error: null,
    });

    // FCM 지원 여부 확인 / FCMサポート可否確認
    useEffect(() => {
        const isSupported = "Notification" in window && "serviceWorker" in navigator;
        setStatus(prev => ({ ...prev, isSupported }));
        
        if (isSupported) {
            console.log("✅ FCM 지원 브라우저 / FCMサポートブラウザ");
        } else {
            console.warn("⚠️ FCM을 지원하지 않는 브라우저입니다 / FCMをサポートしていないブラウザです");
        }
    }, []);

    // FCM 메시지 리스너 설정 / FCMメッセージリスナー設定
    useEffect(() => {
        if (!status.isSupported) return;

        setupFCMListener((payload) => {
            console.log("🔔 FCM 메시지 수신 / FCMメッセージ受信:", payload);
            
            // 메시지 수신 시 상태 업데이트 / メッセージ受信時状態更新
            setStatus(prev => ({
                ...prev,
                isRegistered: true, // 메시지를 받았다는 것은 등록되어 있다는 의미 / メッセージを受信したということは登録されているという意味
            }));
        });
    }, [status.isSupported]);

    // FCM 토큰 등록 / FCMトークン登録
    const registerToken = useCallback(async (studentNum: string): Promise<boolean> => {
        if (!status.isSupported) {
            setStatus(prev => ({ ...prev, error: "FCM을 지원하지 않는 브라우저입니다" }));
            return false;
        }

        setStatus(prev => ({ ...prev, isRegistering: true, error: null }));

        try {
            // FCM 토큰 발급 / FCMトークン発行
            const token = await getFCMToken();
            if (!token) {
                setStatus(prev => ({ 
                    ...prev, 
                    isRegistering: false, 
                    error: "FCM 토큰을 발급받을 수 없습니다" 
                }));
                return false;
            }

            // 백엔드에 토큰 등록 / バックエンドにトークン登録
            const success = await registerFCMToken(token, studentNum);
            if (!success) {
                setStatus(prev => ({ 
                    ...prev, 
                    isRegistering: false, 
                    error: "FCM 토큰 등록에 실패했습니다" 
                }));
                return false;
            }

            setStatus(prev => ({
                ...prev,
                isRegistered: true,
                isRegistering: false,
                token,
                error: null,
            }));

            console.log("✅ FCM 토큰 등록 완료 / FCMトークン登録完了:", studentNum);
            return true;

        } catch (error) {
            console.error("❌ FCM 토큰 등록 중 에러 / FCMトークン登録中エラー:", error);
            setStatus(prev => ({
                ...prev,
                isRegistering: false,
                error: error instanceof Error ? error.message : "알 수 없는 에러가 발생했습니다",
            }));
            return false;
        }
    }, [status.isSupported]);

    // FCM 토큰 등록 해제 / FCMトークン登録解除
    const unregisterToken = useCallback(async (studentNum: string): Promise<boolean> => {
        try {
            const success = await unregisterFCMToken(studentNum);
            if (success) {
                setStatus(prev => ({
                    ...prev,
                    isRegistered: false,
                    token: null,
                    error: null,
                }));
            }
            return success;
        } catch (error) {
            console.error("❌ FCM 토큰 등록 해제 중 에러 / FCMトークン登録解除中エラー:", error);
            return false;
        }
    }, []);

    // FCM 푸시 테스트 / FCMプッシュテスト
    const testPush = useCallback(async (studentNum: string): Promise<boolean> => {
        try {
            return await testFCMPush(studentNum);
        } catch (error) {
            console.error("❌ FCM 푸시 테스트 중 에러 / FCMプッシュテスト中エラー:", error);
            return false;
        }
    }, []);

    // FCM 토큰 새로고침 / FCMトークンリフレッシュ
    const refreshToken = useCallback(async (): Promise<string | null> => {
        try {
            const newToken = await refreshFCMToken();
            if (newToken) {
                setStatus(prev => ({ ...prev, token: newToken }));
            }
            return newToken;
        } catch (error) {
            console.error("❌ FCM 토큰 새로고침 중 에러 / FCMトークンリフレッシュ中エラー:", error);
            return null;
        }
    }, []);

    // FCM 상태 확인 / FCM状態確認
    const checkStatus = useCallback(async (studentNum: string): Promise<boolean> => {
        try {
            return await checkFCMTokenStatus(studentNum);
        } catch (error) {
            console.error("❌ FCM 상태 확인 중 에러 / FCM状態確認中エラー:", error);
            return false;
        }
    }, []);

    // 에러 클리어 / エラークリア
    const clearError = useCallback(() => {
        setStatus(prev => ({ ...prev, error: null }));
    }, []);

    return {
        status,
        registerToken,
        unregisterToken,
        testPush,
        refreshToken,
        checkStatus,
        clearError,
    };
}
