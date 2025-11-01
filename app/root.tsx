// app/root.tsx
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { useEffect, useState, useCallback } from "react";
import type { Route } from "./+types/root";
import Header from "./components/ui/header";
import HamburgerMenu from "./components/ui/hamburger-menu";
import HamburgerMenuBtn from "./components/ui/hamburger-menu-btn";
import Footer from "./components/ui/footer";
import UpdateModal from "./components/modal/update-modal";
import UpdateSuccessModal from "./components/modal/update-success-modal";
import { useAppStateSync } from "./hooks/useAppStateSync";
import { markVersionAsSeen } from "./utils/versionCheckBackend";
import { reinstallPWA } from "./utils/clearCache";
import DataUpdateModal from "./components/modal/DataUpdateModal";
import "./utils/fcmTest"; // FCM 테스트 함수 등록

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
        href: "/icons/pwa-128.png?v=2",
        type: "image/png",
        sizes: "192x192",
    },
    { rel: "apple-touch-icon", href: "/icons/pwa-128.png?v=2" },
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
    const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
    const [showDataUpdateModal, setShowDataUpdateModal] = useState(false);

    // 🆕 コールバック関数をuseCallbackでメモ化（無限ループを防ぐ）
    const handleVersionUpdated = useCallback((info: { version: string; message: string }) => {
        setUpdateInfo(info);
        setShowUpdateModal(true);
    }, []);

    // 🆕 アプリ状態同期フック（バージョン + データ更新の統合チェック）
    // skipInitialMount: false - root.txaでの初期化を削除し、useAppStateSyncのみで統一
    const { sync: syncAppState } = useAppStateSync({
        autoCheck: !isMaintenanceMode,
        checkOnMount: true,
        skipInitialMount: false,
        checkOnVisibilityChange: true,
        checkOnFocus: true,
        enablePeriodicCheck: true,
        checkOnNetworkRecovery: true,
        enableManualTrigger: true,
        onVersionUpdated: handleVersionUpdated,
    });

    // 🆕 グローバルに手動同期関数を公開
    useEffect(() => {
        (window as any).__appSync = syncAppState;
    }, [syncAppState]);

    // 🆕 データ更新モーダルイベントリスナー
    useEffect(() => {
        const handleDataUpdateModal = () => {
            setShowDataUpdateModal(true);
        };

        window.addEventListener("data-updated-modal", handleDataUpdateModal);

        return () => {
            window.removeEventListener("data-updated-modal", handleDataUpdateModal);
        };
    }, []);

    useEffect(() => {
        // メンテナンスモードチェック
        const maintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === "true";
        if (maintenanceMode) {
            setIsMaintenanceMode(true);
        }

        // アップデート完了チェック
        const updateCompleted = localStorage.getItem("app:update_completed");
        if (updateCompleted === "true") {
            localStorage.removeItem("app:update_completed");
            setShowUpdateSuccess(true);
        }
    }, []);

    useEffect(() => {
        // Service Worker 등록 (통합 버전)
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js", { scope: "/" })
                .then(async (reg) => {
                    // Service Worker更新検知
                    reg.addEventListener("updatefound", () => {
                        const newWorker = reg.installing;

                        if (newWorker) {
                            newWorker.addEventListener("statechange", () => {
                                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                                    // オプション: 自動リロードを促す通知を表示
                                    if ("Notification" in window && Notification.permission === "granted") {
                                        new Notification("RecTime更新", {
                                            body: "新しいバージョンが利用可能です。ページをリロードしてください。",
                                            tag: "sw-update",
                                        });
                                    }
                                } else if (newWorker.state === "activated") {
                                }
                            });
                        }
                    });

                    // Periodic Background Syncを登録（サポートされている場合）
                    if ("periodicSync" in reg) {
                        try {
                            await (reg as any).periodicSync.register("check-notifications", {
                                minInterval: 60 * 1000, // 1分（ブラウザが実際の間隔を決定）
                            });
                        } catch (error) {
                            console.warn("[SW] Periodic Background Sync登録失敗:", error);
                        }
                    }
                })
                .catch((err) => console.error("[SW] register failed:", err));

            // Service Workerからのメッセージを受信
            navigator.serviceWorker.addEventListener("message", (event) => {
                if (event.data && event.data.type === "SW_UPDATED") {
                    console.log("[SW] 💬 Service Workerからメッセージ:", event.data.message);
                }
            });
        }

        // 🔴 永続ストレージを要求（データ削除を防ぐ - 優先度1）
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage
                .persist()
                .then((isPersisted) => {
                    if (isPersisted) {
                        console.log("[Storage] ✅ 永続ストレージが許可されました");
                    } else {
                        console.warn("[Storage] ⚠️  永続ストレージが許可されませんでした");
                        console.warn("[Storage] アプリを定期的に使用しない場合、データが削除される可能性があります");
                    }
                })
                .catch((error) => {
                    console.error("[Storage] 永続ストレージ要求エラー:", error);
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
        const maintenanceMessage =
            import.meta.env.VITE_MAINTENANCE_MESSAGE || "メンテナンス中です。しばらくお待ちください。";

        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center bg-white px-6">
                <div className="mb-4 text-6xl">🔧</div>
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
                <UpdateModal onUpdate={handleUpdate} version={updateInfo.version} message={updateInfo.message} />
            )}

            {/* アップデート完了モーダル */}
            {showUpdateSuccess && <UpdateSuccessModal onClose={() => setShowUpdateSuccess(false)} />}

            {/* 🆕 データ更新モーダル */}
            <DataUpdateModal
                isOpen={showDataUpdateModal}
                onClose={() => setShowDataUpdateModal(false)}
            />
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
