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
                injectRegister: null, // SW 등록 코드 주입 금지
                includeAssets: ["favicon.ico", "icons/*"],
                manifest: false, // public/manifest.webmanifest 사용
                devOptions: { enabled: false }, // 개발 모드 SW 생성 비활성
                filename: "pwa-sw.js", // 혹시 생성돼도 sw.js와 충돌 방지
            }),
        ],
        server: {
            proxy: {
                "/api": {
                    target: "http://127.0.0.1:8787", // 백엔드 주소
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
