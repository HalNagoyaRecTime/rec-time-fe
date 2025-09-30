// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    return {
        define: {
            __VITE_APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || "2025-09-12-01"),
            __VITE_APP_NAME__: JSON.stringify(env.VITE_APP_NAME || "RecTime PWA"),
        },
        plugins: [
            reactRouter(),
            tailwindcss(),
            VitePWA({
                injectRegister: null,
                includeAssets: ["favicon.ico", "icons/*"],
                manifest: false,
                devOptions: { enabled: false },
                filename: "pwa-sw.js",
            }),
        ],
        server: {
            proxy: {
                "/api": {
                    // 개발 환경에서는 .env.development 참고
                    target: env.VITE_API_BASE_URL || "http://127.0.0.1:8787",
                    changeOrigin: true,
                },
            },
        },
        preview: {
            host: env.VITE_HOST || "0.0.0.0",
            port: Number(env.VITE_PREVIEW_PORT) || 4173,
            strictPort: true,
        },
    };
});
