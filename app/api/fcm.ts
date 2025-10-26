// FCM 관련 API 타입 정의
// FCM関連API型定義

export interface FCMTokenRequest {
    token: string;
    timestamp: string;
}

export interface FCMTokenResponse {
    success: boolean;
    message: string;
}

export interface FCMPushRequest {
    title: string;
    body: string;
    data?: Record<string, string>;
    token?: string; // 특정 토큰에만 전송할 경우
}

export interface FCMPushResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}
