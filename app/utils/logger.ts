/**
 * ログシステムユーティリティ
 * デバッグモードでのみログを出力し、本番環境では無効化
 * 로그 시스템 유틸리티
 * 디버그 모드에서만 로그를 출력하고, 프로덕션 환경에서는 비활성화
 */

// ログレベル定義
// 로그 레벨 정의
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    CRITICAL = 4,
}

// ログエントリの型定義
// 로그 엔트리의 타입 정의
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: string;
    data?: any;
    stack?: string;
    userAgent?: string;
    url?: string;
    userId?: string;
    sessionId?: string;
}

// デバッグモード判定
// 디버그 모드 판정
export function isDebugMode(): boolean {
    // 開発環境の判定
    // 개발 환경의 판정
    if (import.meta.env.DEV) {
        return true;
    }
    
    // 環境変数でのデバッグモード指定
    // 환경 변수로 디버그 모드 지정
    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
        return true;
    }
    
    // URLパラメータでのデバッグモード指定
    // URL 파라미터로 디버그 모드 지정
    if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('debug') === 'true') {
            return true;
        }
    }
    
    return false;
}

// セッションID生成
// 세션 ID 생성
function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// セッションID取得（初回生成）
// 세션 ID 획득 (최초 생성)
let sessionId: string | null = null;
export function getSessionId(): string {
    if (!sessionId) {
        sessionId = generateSessionId();
    }
    return sessionId;
}

// ログフォーマッター
// 로그 포맷터
function formatLogEntry(entry: LogEntry): string {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
    const levelName = levelNames[entry.level] || 'UNKNOWN';
    
    let formatted = `[${entry.timestamp}] ${levelName}`;
    
    if (entry.context) {
        formatted += ` [${entry.context}]`;
    }
    
    formatted += `: ${entry.message}`;
    
    if (entry.data) {
        formatted += `\nData: ${JSON.stringify(entry.data, null, 2)}`;
    }
    
    if (entry.stack) {
        formatted += `\nStack: ${entry.stack}`;
    }
    
    if (entry.userId) {
        formatted += `\nUser: ${entry.userId}`;
    }
    
    if (entry.sessionId) {
        formatted += `\nSession: ${entry.sessionId}`;
    }
    
    return formatted;
}

// ログエントリ作成
// 로그 엔트리 생성
function createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    error?: Error
): LogEntry {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
        data,
        sessionId: getSessionId(),
    };
    
    // ブラウザ環境での追加情報
    // 브라우저 환경에서의 추가 정보
    if (typeof window !== 'undefined') {
        entry.userAgent = navigator.userAgent;
        entry.url = window.location.href;
    }
    
    // エラー情報の追加
    // 에러 정보의 추가
    if (error) {
        entry.stack = error.stack;
        entry.data = { ...entry.data, error: error.message };
    }
    
    return entry;
}

// ログ出力関数
// 로그 출력 함수
function outputLog(entry: LogEntry): void {
    if (!isDebugMode()) {
        return;
    }
    
    const formatted = formatLogEntry(entry);
    
    // コンソール出力
    // 콘솔 출력
    switch (entry.level) {
        case LogLevel.DEBUG:
            console.debug(formatted);
            break;
        case LogLevel.INFO:
            console.info(formatted);
            break;
        case LogLevel.WARN:
            console.warn(formatted);
            break;
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
            console.error(formatted);
            break;
    }
    
    // ローカルストレージへの保存（デバッグ用）
    // 로컬 스토리지에 저장 (디버그용)
    if (typeof window !== 'undefined') {
        try {
            const logs = JSON.parse(localStorage.getItem('debug_logs') || '[]');
            logs.push(entry);
            
            // 最新100件のみ保持
            // 최신 100건만 유지
            if (logs.length > 100) {
                logs.splice(0, logs.length - 100);
            }
            
            localStorage.setItem('debug_logs', JSON.stringify(logs));
        } catch (e) {
            console.warn('Failed to save log to localStorage:', e);
        }
    }
}

// ログ関数群 - 重要なログのみ
// 로그 함수군 - 중요한 로그만
export const logger = {
    // デバッグログは最小限に
    // 디버그 로그는 최소한으로
    debug: (message: string, context?: string, data?: any) => {
        const entry = createLogEntry(LogLevel.DEBUG, message, context, data);
        outputLog(entry);
    },
    
    // 情報ログは最小限に
    // 정보 로그는 최소한으로
    info: (message: string, context?: string, data?: any) => {
        const entry = createLogEntry(LogLevel.INFO, message, context, data);
        outputLog(entry);
    },
    
    // 警告ログ
    // 경고 로그
    warn: (message: string, context?: string, data?: any) => {
        const entry = createLogEntry(LogLevel.WARN, message, context, data);
        outputLog(entry);
    },
    
    // エラーログ - 重要
    // 에러 로그 - 중요
    error: (message: string, context?: string, data?: any, error?: Error) => {
        const entry = createLogEntry(LogLevel.ERROR, message, context, data, error);
        outputLog(entry);
    },
    
    // 致命的エラーログ - 最重要
    // 치명적 에러 로그 - 최중요
    critical: (message: string, context?: string, data?: any, error?: Error) => {
        const entry = createLogEntry(LogLevel.CRITICAL, message, context, data, error);
        outputLog(entry);
    },
};

// ログクリア関数
// 로그 클리어 함수
export function clearDebugLogs(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('debug_logs');
    }
}

// ログ取得関数
// 로그 획득 함수
export function getDebugLogs(): LogEntry[] {
    if (typeof window !== 'undefined') {
        try {
            return JSON.parse(localStorage.getItem('debug_logs') || '[]');
        } catch (e) {
            return [];
        }
    }
    return [];
}

// ログエクスポート関数
// 로그 익스포트 함수
export function exportDebugLogs(): string {
    const logs = getDebugLogs();
    return JSON.stringify(logs, null, 2);
}
