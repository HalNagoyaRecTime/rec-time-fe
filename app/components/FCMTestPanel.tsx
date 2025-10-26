/**
 * FCM 테스트 패널 컴포넌트
 * FCMテストパネルコンポーネント
 */

import { useState } from "react";
import { useStudentData } from "~/hooks/useStudentData";
import { useFCM } from "~/hooks/useFCM";

export default function FCMTestPanel() {
    const { studentId } = useStudentData();
    const { 
        status: fcmStatus, 
        registerToken, 
        unregisterToken, 
        testPush, 
        refreshToken,
        checkStatus,
        clearError 
    } = useFCM();
    
    const [isLoading, setIsLoading] = useState(false);
    const [testResult, setTestResult] = useState<string | null>(null);

    const handleRegisterToken = async () => {
        if (!studentId) {
            setTestResult("❌ 먼저 로그인해주세요 / まずログインしてください");
            return;
        }
        
        setIsLoading(true);
        setTestResult(null);
        
        try {
            const success = await registerToken(studentId);
            setTestResult(success ? 
                "✅ FCM 토큰 등록 성공 / FCMトークン登録成功" : 
                "❌ FCM 토큰 등록 실패 / FCMトークン登録失敗"
            );
        } catch (error) {
            setTestResult(`❌ 에러: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnregisterToken = async () => {
        if (!studentId) {
            setTestResult("❌ 먼저 로그인해주세요 / まずログインしてください");
            return;
        }
        
        setIsLoading(true);
        setTestResult(null);
        
        try {
            const success = await unregisterToken(studentId);
            setTestResult(success ? 
                "✅ FCM 토큰 등록 해제 성공 / FCMトークン登録解除成功" : 
                "❌ FCM 토큰 등록 해제 실패 / FCMトークン登録解除失敗"
            );
        } catch (error) {
            setTestResult(`❌ 에러: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestPush = async () => {
        if (!studentId) {
            setTestResult("❌ 먼저 로그인해주세요 / まずログインしてください");
            return;
        }
        
        setIsLoading(true);
        setTestResult(null);
        
        try {
            const success = await testPush(studentId);
            setTestResult(success ? 
                "✅ FCM 테스트 푸시 전송 성공 / FCMテストプッシュ送信成功" : 
                "❌ FCM 테스트 푸시 전송 실패 / FCMテストプッシュ送信失敗"
            );
        } catch (error) {
            setTestResult(`❌ 에러: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshToken = async () => {
        setIsLoading(true);
        setTestResult(null);
        
        try {
            const newToken = await refreshToken();
            setTestResult(newToken ? 
                `✅ FCM 토큰 새로고침 성공 / FCMトークンリフレッシュ成功: ${newToken.substring(0, 20)}...` : 
                "❌ FCM 토큰 새로고침 실패 / FCMトークンリフレッシュ失敗"
            );
        } catch (error) {
            setTestResult(`❌ 에러: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckStatus = async () => {
        if (!studentId) {
            setTestResult("❌ 먼저 로그인해주세요 / まずログインしてください");
            return;
        }
        
        setIsLoading(true);
        setTestResult(null);
        
        try {
            const isRegistered = await checkStatus(studentId);
            setTestResult(isRegistered ? 
                "✅ FCM 토큰이 등록되어 있습니다 / FCMトークンが登録されています" : 
                "❌ FCM 토큰이 등록되어 있지 않습니다 / FCMトークンが登録されていません"
            );
        } catch (error) {
            setTestResult(`❌ 에러: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!studentId) {
        return (
            <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-2">🔔 FCM 테스트 / FCMテスト</h3>
                <p className="text-gray-600">먼저 로그인해주세요 / まずログインしてください</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold">🔔 FCM 테스트 / FCMテスト</h3>
            
            {/* FCM 상태 표시 / FCM状態表示 */}
            <div className="space-y-2">
                <div className="text-sm">
                    <strong>FCM 지원:</strong> {fcmStatus.isSupported ? "✅ 지원" : "❌ 미지원"}
                </div>
                <div className="text-sm">
                    <strong>토큰 등록:</strong> {fcmStatus.isRegistered ? "✅ 등록됨" : "❌ 미등록"}
                </div>
                <div className="text-sm">
                    <strong>등록 중:</strong> {fcmStatus.isRegistering ? "⏳ 진행 중" : "✅ 완료"}
                </div>
                {fcmStatus.token && (
                    <div className="text-sm">
                        <strong>토큰:</strong> {fcmStatus.token.substring(0, 30)}...
                    </div>
                )}
                {fcmStatus.error && (
                    <div className="text-sm text-red-600">
                        <strong>에러:</strong> {fcmStatus.error}
                    </div>
                )}
            </div>

            {/* 테스트 버튼들 / テストボタン들 */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={handleRegisterToken}
                    disabled={isLoading || fcmStatus.isRegistered}
                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    토큰 등록 / トークン登録
                </button>
                
                <button
                    onClick={handleUnregisterToken}
                    disabled={isLoading || !fcmStatus.isRegistered}
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
                >
                    토큰 해제 / トークン解除
                </button>
                
                <button
                    onClick={handleTestPush}
                    disabled={isLoading || !fcmStatus.isRegistered}
                    className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                >
                    테스트 푸시 / テストプッシュ
                </button>
                
                <button
                    onClick={handleRefreshToken}
                    disabled={isLoading}
                    className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400"
                >
                    토큰 새로고침 / トークンリフレッシュ
                </button>
                
                <button
                    onClick={handleCheckStatus}
                    disabled={isLoading}
                    className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
                >
                    상태 확인 / 状態確認
                </button>
                
                <button
                    onClick={clearError}
                    disabled={!fcmStatus.error}
                    className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400"
                >
                    에러 클리어 / エラークリア
                </button>
            </div>

            {/* 테스트 결과 / テスト結果 */}
            {testResult && (
                <div className="p-3 bg-white border rounded">
                    <strong>테스트 결과 / テスト結果:</strong>
                    <div className="mt-1">{testResult}</div>
                </div>
            )}

            {/* 로딩 표시 / ローディング表示 */}
            {isLoading && (
                <div className="text-center text-blue-600">
                    ⏳ 처리 중... / 処理中...
                </div>
            )}
        </div>
    );
}
