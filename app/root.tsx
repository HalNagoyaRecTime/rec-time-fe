// app/root.tsx
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/root";
import Header from "./components/ui/header";
import HamburgerMenu from "./components/ui/hamburger-menu";
import HamburgerMenuBtn from "./components/ui/hamburger-menu-btn";
import Footer from "./components/ui/footer";

import "./app.css";

export const meta: Route.MetaFunction = () => {
    return [
        { title: "recTime - レクリエーション呼び出しアプリ" },
        { name: "author", content: "recTime" },
        { property: "og:title", content: "recTime - 授業時間割アプリ" },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "recTime" },
    ];
};

export const links: Route.LinksFunction = () => [
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
        <html lang="ja">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="theme-color" content="#000D91" />
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
    }, []);

    return (
        <div className="wrapper flex h-screen w-screen flex-col bg-white">
            <Header />
            <HamburgerMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <HamburgerMenuBtn onClick={() => setIsMenuOpen(!isMenuOpen)} isOpen={isMenuOpen} />
            <main className="flex flex-1 flex-col overflow-y-auto">
                <Outlet />
                <Footer />
            </main>
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
