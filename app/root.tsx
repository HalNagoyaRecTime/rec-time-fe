// app/root.tsx
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/root";
import Header from "./components/ui/header";
import HamburgerMenu from "./components/ui/hamburger-menu";
import HamburgerMenuBtn from "./components/ui/hamburger-menu-btn";
import Footer from "./components/ui/footer";
import { ErrorBoundary as CustomErrorBoundary, setupGlobalErrorHandlers } from "./components/ErrorBoundary";
import { logger } from "./utils/logger";
import { getGitInfo, logGitInfo } from "./utils/gitInfo";
import { setupApiLogging } from "./utils/apiLogger";

import "./app.css";

export const links: Route.LinksFunction = () => [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
    },
    // Adobe Fonts - 源ノ角ゴシック Heavy for titles
    {
        rel: "stylesheet",
        href: "https://use.typekit.net/kux1ncf.css",
    },
    { rel: "manifest", href: "/manifest.webmanifest" },
    {
        rel: "icon",
        href: "/icons/pwa-192.png",
        type: "image/png",
        sizes: "192x192",
    },
    { rel: "apple-touch-icon", href: "/icons/pwa-192.png" },
];

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="theme-color" content="#ffffff" />
                <title>recTime</title>
                <Meta />
                <Links />
            </head>
            <body className="overflow-hidden">
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function App() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        // ログシステムの初期化
        // 로그 시스템의 초기화
        const initializeLogging = async () => {
            try {
                // グローバルエラーハンドラーの設定
                // 글로벌 에러 핸들러의 설정
                setupGlobalErrorHandlers();
                
                // APIログミドルウェアの設定
                // API 로그 미들웨어의 설정
                setupApiLogging();
                
                // Git情報の取得とログ出力
                // Git 정보의 획득과 로그 출력
                const gitInfo = await getGitInfo();
                if (gitInfo) {
                    logGitInfo(gitInfo);
                }
                
                // アプリケーション起動完了（ログなし）
                // 애플리케이션 시작 완료 (로그 없음)
            } catch (error) {
                console.error('ログシステムの初期化に失敗 / 로그 시스템 초기화 실패:', error);
            }
        };

        initializeLogging();

        // Service Workerの登録
        // Service Worker의 등록
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js", { scope: "/" })
                .then((reg) => {
                    // Service Worker登録完了（ログなし）
                    // Service Worker 등록 완료 (로그 없음)
                })
                .catch((err) => {
                    logger.error('Service Worker登録失敗 / Service Worker 등록 실패', 'App', null, err);
                });
        }
    }, []);

    return (
        <CustomErrorBoundary>
            <div className="wrapper flex h-screen w-screen flex-col bg-blue-950">
                <Header />
                <HamburgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
                <HamburgerMenuBtn onClick={() => setIsMenuOpen(!isMenuOpen)} isOpen={isMenuOpen} />
                <main className="flex flex-1 flex-col overflow-y-auto">
                    <Outlet />
                    <Footer />
                </main>
            </div>
        </CustomErrorBoundary>
    );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack: string | undefined;

    // エラーログの記録
    // 에러 로그의 기록
    useEffect(() => {
        const logError = async () => {
            const gitInfo = await getGitInfo();
            const errorContext = {
                ...gitInfo,
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
                url: typeof window !== 'undefined' ? window.location.href : 'unknown',
                timestamp: new Date().toISOString(),
            };

            if (isRouteErrorResponse(error)) {
                logger.error(
                    `ルートエラー / 라우트 에러: ${error.status} ${error.statusText}`,
                    'RouteErrorBoundary',
                    { error, ...errorContext }
                );
            } else if (error instanceof Error) {
                logger.critical(
                    `未処理エラー / 미처리 에러: ${error.message}`,
                    'RouteErrorBoundary',
                    { error: error.message, stack: error.stack, ...errorContext },
                    error
                );
            } else {
                logger.error(
                    '未知のエラーが発生しました / 알 수 없는 에러가 발생했습니다',
                    'RouteErrorBoundary',
                    { error, ...errorContext }
                );
            }
        };

        logError();
    }, [error]);

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className="container mx-auto p-4 pt-16">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full overflow-x-auto p-4">
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    );
}
