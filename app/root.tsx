// app/root.tsx
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { useEffect } from "react";
import type { Route } from "./types/root";
import DevNavigation from "./components/ui/devNavigation";
import HamburgerMenu from "./components/ui/hamburger-menu";
import Footer from "./components/ui/footer";
import Header from "./components/ui/header";
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
            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function App() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js", { scope: "/" })
                .then((reg) => console.log("[SW] registered:", reg.scope))
                .catch((err) => console.error("[SW] register failed:", err));
        }
    }, []);

    return (
        <div className="flex min-h-screen w-screen flex-col bg-black">
            <div className="wrapper relative mx-auto flex h-full w-full max-w-6xl flex-1 flex-col bg-blue-950">
                <Header />
                <main className="flex flex-1 px-2">
                    <Outlet />
                </main>
                {/* ↓仮のナビゲーション↓ */}
                <DevNavigation />
                <Footer />
            </div>
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
