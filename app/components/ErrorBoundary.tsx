/**
 * エラーバウンダリコンポーネント
 * React コンポーネントのエラーをキャッチしてログに記録
 * 에러 바운더리 컴포넌트
 * React 컴포넌트의 에러를 캐치해서 로그에 기록
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '~/utils/logger';
import { getGitInfo, createErrorContext } from '~/utils/gitInfo';

// エラーバウンダリのProps
// 에러 바운더리의 Props
interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// エラーバウンダリのState
// 에러 바운더리의 State
interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        // エラーが発生した場合のstate更新
        // 에러가 발생한 경우의 state 업데이트
        return { hasError: true, error };
    }

    async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // エラー情報をログに記録
        // 에러 정보를 로그에 기록
        const gitInfo = await getGitInfo();
        const errorContext = createErrorContext(gitInfo);
        
        logger.critical(
            'Reactコンポーネントでエラーが発生しました / React 컴포넌트에서 에러가 발생했습니다',
            'ErrorBoundary',
            {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
                errorInfo: {
                    componentStack: errorInfo.componentStack,
                },
                ...errorContext,
            },
            error
        );

        // カスタムエラーハンドラーを呼び出し
        // 커스텀 에러 핸들러를 호출
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // カスタムフォールバックUI
            // 커스텀 폴백 UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // デフォルトエラーUI
            // 디폴트 에러 UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                        <div className="flex items-center mb-4">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-8 w-8 text-red-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-medium text-gray-900">
                                    エラーが発生しました / 에러가 발생했습니다
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    申し訳ございません。予期しないエラーが発生しました。 / 죄송합니다. 예상치 못한 에러가 발생했습니다.
                                </p>
                            </div>
                        </div>
                        
                        <div className="mt-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                ページを再読み込み / 페이지를 다시 로드
                            </button>
                        </div>
                        
                        {import.meta.env.DEV && this.state.error && (
                            <details className="mt-4">
                                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                                    エラー詳細 (開発モード) / 에러 상세 (개발 모드)
                                </summary>
                                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// グローバルエラーハンドラー設定
// 글로벌 에러 핸들러 설정
export function setupGlobalErrorHandlers() {
    // 未処理のPromise拒否をキャッチ
    // 미처리된 Promise 거부를 캐치
    window.addEventListener('unhandledrejection', async (event) => {
        const gitInfo = await getGitInfo();
        const errorContext = createErrorContext(gitInfo);
        
        logger.critical(
            '未処理のPromise拒否が発生しました / 미처리된 Promise 거부가 발생했습니다',
            'GlobalErrorHandler',
            {
                reason: event.reason,
                promise: event.promise,
                ...errorContext,
            }
        );
        
        // デバッグモードでない場合はデフォルトの動作を防ぐ
        // 디버그 모드가 아닌 경우는 디폴트 동작을 방지
        if (!import.meta.env.DEV) {
            event.preventDefault();
        }
    });

    // 未処理のエラーをキャッチ
    // 미처리된 에러를 캐치
    window.addEventListener('error', async (event) => {
        const gitInfo = await getGitInfo();
        const errorContext = createErrorContext(gitInfo);
        
        logger.critical(
            '未処理のエラーが発生しました / 미처리된 에러가 발생했습니다',
            'GlobalErrorHandler',
            {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                ...errorContext,
            }
        );
    });
}
