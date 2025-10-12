/**
 * API呼び出しログミドルウェア
 * APIリクエストとレスポンスをログに記録
 * API 호출 로그 미들웨어
 * API 리퀘스트와 응답을 로그에 기록
 */

import { logger } from './logger';
import { getGitInfo, createErrorContext } from './gitInfo';

// APIリクエスト情報の型定義
// API 리퀘스트 정보의 타입 정의
interface ApiRequestInfo {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
    timestamp: string;
    requestId: string;
}

// APIレスポンス情報の型定義
// API 응답 정보의 타입 정의
interface ApiResponseInfo {
    status: number;
    statusText: string;
    headers?: Record<string, string>;
    body?: any;
    timestamp: string;
    duration: number;
    requestId: string;
}

// リクエストID生成
// 리퀘스트 ID 생성
function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// リクエスト情報をログに記録
// 리퀘스트 정보를 로그에 기록
export function logApiRequest(
    url: string,
    method: string,
    headers?: Record<string, string>,
    body?: any
): string {
    const requestId = generateRequestId();
    const requestInfo: ApiRequestInfo = {
        url,
        method,
        headers,
        body,
        timestamp: new Date().toISOString(),
        requestId,
    };

    // APIリクエストログは最小限に（エラーのみ記録）
    // API 리퀘스트 로그는 최소한으로 (에러만 기록)

    return requestId;
}

// レスポンス情報をログに記録
// 응답 정보를 로그에 기록
export function logApiResponse(
    requestId: string,
    url: string,
    method: string,
    status: number,
    statusText: string,
    headers?: Record<string, string>,
    body?: any,
    startTime?: number
): void {
    const duration = startTime ? Date.now() - startTime : 0;
    const responseInfo: ApiResponseInfo = {
        status,
        statusText,
        headers,
        body,
        timestamp: new Date().toISOString(),
        duration,
        requestId,
    };

    // エラーレスポンスのみログに記録
    // 에러 응답만 로그에 기록
    if (status >= 400) {
        const logMessage = `APIエラー / API 에러: ${method} ${url} - ${status} ${statusText} (${duration}ms)`;
        logger.error(logMessage, 'ApiLogger', responseInfo);
    }
}

// エラー情報をログに記録
// 에러 정보를 로그에 기록
export async function logApiError(
    requestId: string,
    url: string,
    method: string,
    error: Error,
    startTime?: number
): Promise<void> {
    const duration = startTime ? Date.now() - startTime : 0;
    const gitInfo = await getGitInfo();
    const errorContext = createErrorContext(gitInfo);

    logger.critical(
        `APIエラー / API 에러: ${method} ${url}`,
        'ApiLogger',
        {
            requestId,
            url,
            method,
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
            },
            duration,
            ...errorContext,
        },
        error
    );
}

// fetch APIをラップしたログ付きfetch
// fetch API를 래핑한 로그 포함 fetch
export async function loggedFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const method = options.method || 'GET';
    const startTime = Date.now();
    
    // リクエストログ
    // 리퀘스트 로그
    const requestId = logApiRequest(
        url,
        method,
        options.headers as Record<string, string>,
        options.body
    );

    try {
        const response = await fetch(url, options);
        
        // レスポンスボディを読み取り（ログ用）
        // 응답 바디를 읽기 (로그용)
        const responseClone = response.clone();
        let responseBody: any = null;
        
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                responseBody = await responseClone.json();
            } else {
                responseBody = await responseClone.text();
            }
        } catch (e) {
            // レスポンスボディの読み取りに失敗した場合は無視
            // 응답 바디 읽기에 실패한 경우는 무시
        }

        // レスポンスログ
        // 응답 로그
        logApiResponse(
            requestId,
            url,
            method,
            response.status,
            response.statusText,
            Object.fromEntries(response.headers.entries()),
            responseBody,
            startTime
        );

        return response;
    } catch (error) {
        // エラーログ
        // 에러 로그
        await logApiError(
            requestId,
            url,
            method,
            error as Error,
            startTime
        );
        
        throw error;
    }
}

// 既存のfetchを置き換える関数
// 기존의 fetch를 교체하는 함수
export function setupApiLogging() {
    // グローバルfetchを置き換え
    // 글로벌 fetch를 교체
    if (typeof window !== 'undefined') {
        const originalFetch = window.fetch;
        window.fetch = loggedFetch;
        
        // APIログミドルウェア設定完了（ログなし）
        // API 로그 미들웨어 설정 완료 (로그 없음)
        
        // デバッグモードでない場合は元のfetchに戻す
        // 디버그 모드가 아닌 경우는 원래 fetch로 되돌림
        if (!import.meta.env.DEV) {
            // 本番環境ではログを無効化
            // 프로덕션 환경에서는 로그를 비활성화
            window.fetch = originalFetch;
        }
    }
}
