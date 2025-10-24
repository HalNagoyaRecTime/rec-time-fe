// app/root.tsx
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/root";
import Header from "./components/ui/header";
import HamburgerMenu from "./components/ui/hamburger-menu";
import HamburgerMenuBtn from "./components/ui/hamburger-menu-btn";
import Footer from "./components/ui/footer";
import UpdateModal from "./components/ui/update-modal";
import { checkVersionFromBackend, markVersionAsSeen } from "./utils/versionCheckBackend";
import { reinstallPWA } from "./utils/clearCache";

import "./app.css";

export const meta: Route.MetaFunction = () => {
    return [
        { title: "recTime - レクリエーション呼び出しアプリ" },
        { name: "author", content: "recTime" },
        { property: "og:title", content: "recTime - レクリエーション通知アプリ" },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "recTime" },
    ];
};

export const links: Route.LinksFunction = () => [
    { rel: "manifest", href: "/manifest.webmanifest" },
    {
        rel: "icon",
        href: "/icons/pwa-192.png?v=2",
        type: "image/png",
        sizes: "192x192",
    },
    { rel: "apple-touch-icon", href: "/icons/pwa-192.png?v=2" },
];

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="theme-color" content="#ffffff" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
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
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<{ version: string; message: string } | null>(null);

    // バージョンチェック関数（共通化）
    const checkForUpdates = async (source: string) => {
        const { hasUpdate, latestVersion, message, skipped } = await checkVersionFromBackend();
        
        if (skipped) {
            console.log(`[${source}] チェックスキップ（5分以内）`);
            return;
        }
        
        if (hasUpdate) {
            console.log(`[${source}] 🆕 新しいバージョンを検出: ${latestVersion}`);
            setUpdateInfo({ version: latestVersion, message: message || "更新情報なし" });
            setShowUpdateModal(true);
        }
    };

    useEffect(() => {
        // メンテナンスモードチェック
        const maintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';
        if (maintenanceMode) {
            setIsMaintenanceMode(true);
            return;
        }

        // 1. 起動時チェック
        checkForUpdates('起動時');

        // 2. ランダムな初回待機時間（1-5分）
        const randomDelay = Math.floor(Math.random() * 4 * 60 * 1000) + 60 * 1000; // 1-5分
        console.log(`[VersionCheck] 初回チェックまで ${Math.floor(randomDelay / 1000 / 60)}分待機`);

        const initialTimer = setTimeout(() => {
            checkForUpdates('定期チェック（初回）');

            // 3. 5分ごとの定期チェック
            const interval = setInterval(() => {
                checkForUpdates('定期チェック');
            }, 5 * 60 * 1000); // 5分

            return () => clearInterval(interval);
        }, randomDelay);

        // 4. バックグラウンド復帰時チェック
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('[VersionCheck] バックグラウンドから復帰');
                checkForUpdates('バックグラウンド復帰');
            }
        };

        const handleFocus = () => {
            console.log('[VersionCheck] ウィンドウがフォーカスされました');
            checkForUpdates('フォーカス');
        };

        // 5. 他のコンポーネントからのバージョン更新通知を受信
        const handleVersionUpdateDetected = (event: Event) => {
            const customEvent = event as CustomEvent;
            console.log(`[VersionCheck] 他のコンポーネントから更新検知: ${customEvent.detail.version}`);
            setUpdateInfo({
                version: customEvent.detail.version,
                message: customEvent.detail.message || "更新情報なし"
            });
            setShowUpdateModal(true);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('version-update-detected', handleVersionUpdateDetected);

        return () => {
            clearTimeout(initialTimer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('version-update-detected', handleVersionUpdateDetected);
        };
    }, []);

    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js", { scope: "/" })
                .then(async (reg) => {
                    console.log("[SW] registered:", reg.scope);
                    
                    // Service Worker更新検知
                    reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        console.log("[SW] 🔄 新しいService Workerを検出しました");
                        
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log("[SW] ✅ 新しいService Workerがインストールされました");
                                    console.log("[SW] 📢 ページをリロードすると新しいバージョンが適用されます");
                                    
                                    // オプション: 自動リロードを促す通知を表示
                                    if ('Notification' in window && Notification.permission === 'granted') {
                                        new Notification('RecTime更新', {
                                            body: '新しいバージョンが利用可能です。ページをリロードしてください。',
                                            tag: 'sw-update'
                                        });
                                    }
                                } else if (newWorker.state === 'activated') {
                                    console.log("[SW] 🚀 新しいService Workerが有効になりました");
                                }
                            });
                        }
                    });
                    
                    // 既存のService Worker情報をログ出力
                    if (reg.active) {
                        console.log("[SW] 📦 現在のService Workerバージョン: 2025-10-22-03-ios-15sec");
                    }
                    
                    // Periodic Background Syncを登録（サポートされている場合）
                    if ('periodicSync' in reg) {
                        try {
                            await (reg as any).periodicSync.register('check-notifications', {
                                minInterval: 60 * 1000, // 1分（ブラウザが実際の間隔を決定）
                            });
                            console.log("[SW] Periodic Background Sync登録成功");
                        } catch (error) {
                            console.warn("[SW] Periodic Background Sync登録失敗:", error);
                        }
                    }
                })
                .catch((err) => console.error("[SW] register failed:", err));
            
            // Service Workerからのメッセージを受信
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SW_UPDATED') {
                    console.log("[SW] 💬 Service Workerからメッセージ:", event.data.message);
                }
            });
        }

        // 🔴 永続ストレージを要求（データ削除を防ぐ - 優先度1）
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().then((isPersisted) => {
                if (isPersisted) {
                    console.log("[Storage] ✅ 永続ストレージが許可されました");
                } else {
                    console.warn("[Storage] ⚠️  永続ストレージが許可されませんでした");
                    console.warn("[Storage] アプリを定期的に使用しない場合、データが削除される可能性があります");
                }
            }).catch((error) => {
                console.error("[Storage] 永続ストレージ要求エラー:", error);
            });

            // 現在の状態を確認
            navigator.storage.persisted().then((isPersisted) => {
                console.log(`[Storage] 現在の永続化状態: ${isPersisted ? '永続' : '非永続'}`);
            });
        }
    }, []);

    // 更新処理
    const handleUpdate = async () => {
        if (updateInfo) {
            markVersionAsSeen(updateInfo.version); // バージョン確認済みとしてマーク
        }
        await reinstallPWA(); // PWA再インストール（自動リロード）
    };

    // メンテナンス画面
    if (isMaintenanceMode) {
        const maintenanceMessage = import.meta.env.VITE_MAINTENANCE_MESSAGE || "メンテナンス中です。しばらくお待ちください。";
        
        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center bg-white px-6">
                <div className="text-6xl mb-4">🔧</div>
                <h1 className="mb-2 text-2xl font-bold text-gray-800">メンテナンス中</h1>
                <p className="text-center text-gray-600">{maintenanceMessage}</p>
            </div>
        );
    }

    return (
        <div className="wrapper flex h-screen w-screen flex-col bg-white">
            <Header />
            <HamburgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <HamburgerMenuBtn onClick={() => setIsMenuOpen(!isMenuOpen)} isOpen={isMenuOpen} />
            <main className="flex flex-1 flex-col overflow-y-auto">
                <Outlet />
                <Footer />
            </main>
            
            {/* 更新モーダル */}
            {showUpdateModal && updateInfo && (
                <UpdateModal 
                    onUpdate={handleUpdate}
                    version={updateInfo.version}
                    message={updateInfo.message}
                />
            )}
        </div>
    );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack: string | undefined;

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
