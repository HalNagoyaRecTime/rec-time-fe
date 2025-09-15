// vite.config.ts
import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    reactRouter(),
    VitePWA({
      injectRegister: null, // SW 登録 コード 注入 禁止
      includeAssets: ["favicon.ico", "icons/*"],
      manifest: false, // public/manifest.webmanifest 使用
      devOptions: { enabled: false }, // 開発モードSW生成無効
      filename: "pwa-sw.js", // もし生成されてもsw.jsと名前の衝突を防止
    }),
  ],
  server: { host: true, port: 5173, strictPort: true },
  preview: { host: true, port: 4173, strictPort: true },
});
