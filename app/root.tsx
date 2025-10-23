// app/root.tsx
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/root";
import Header from "./components/ui/header";
import HamburgerMenu from "./components/ui/hamburger-menu";
import HamburgerMenuBtn from "./components/ui/hamburger-menu-btn";
import Footer from "./components/ui/footer";

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
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js", { scope: "/" })
                .then(async (reg) => {
                    console.log("[SW] registered:", reg.scope);
                    
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
