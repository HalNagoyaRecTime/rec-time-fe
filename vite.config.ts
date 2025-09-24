// vite.config.ts
import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
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
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      // 프론트에서 /api 로 부르면 → 로컬 wrangler dev(백엔드)로 전달
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
  preview: { host: true, port: 4173, strictPort: true },
});
