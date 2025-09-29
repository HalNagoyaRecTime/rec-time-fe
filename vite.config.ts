// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // 環境変数バリデーション関数
  const getApiUrl = () => {
    const url = env.VITE_API_URL || "http://127.0.0.1:8787"
    console.log(`[Vite Config] Validating VITE_API_URL: "${url}"`)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error(`Invalid VITE_API_URL format: "${url}". Must start with http:// or https://`)
    }
    return url
  }

  const getPort = (envVar: string, defaultPort: number, name: string) => {
    const rawPort = env[envVar]
    const port = rawPort ? Number(rawPort) : defaultPort

    if (rawPort && isNaN(port)) {
      throw new Error(`Invalid ${name}: "${rawPort}" is not a valid number`)
    }

    if (port < 1 || port > 65535) {
      throw new Error(`Invalid ${name} port: ${port}. Must be between 1-65535`)
    }
    return port
  }

  const getHost = () => {
    const host = env.VITE_HOST || "0.0.0.0"
    if (!host || host.trim() === '') {
      throw new Error('Invalid VITE_HOST: cannot be empty')
    }
    return host
  }

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
    host: getHost(),
    port: getPort('VITE_DEV_PORT', 5173, 'VITE_DEV_PORT'),
    strictPort: true,
    proxy: {
      // 프론트에서 /api 로 부르면 → 로컬 wrangler dev(백엔드)로 전달
      "/api": {
        target: getApiUrl(),
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: getHost(),
    port: getPort('VITE_PREVIEW_PORT', 4173, 'VITE_PREVIEW_PORT'),
    strictPort: true
  },
  }
});
