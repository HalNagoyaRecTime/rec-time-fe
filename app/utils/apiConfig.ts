/**
 * API設定ユーティリティ
 * 開発環境と本番環境で一貫したAPI URLを提供
 */

/**
 * API BaseURLを取得
 *
 * 動作:
 * - 開発環境: "/api" を返す（vite proxyが処理）
 * - 本番環境: "https://backend.example.com" → "https://backend.example.com/api" に変換
 *
 * @returns API BaseURL（末尾スラッシュなし）
 */
export function getApiBaseUrl(): string {
    const base = import.meta.env.VITE_API_BASE_URL || "https://rec-time-be.ellan122316.workers.dev/";
    const cleanBase = base.replace(/\/$/, "");

    // フルURL（http:// または https:// で始まる）の場合、/api を追加
    // 本番環境または開発環境でプロキシを使わない直接アクセスの場合
    if (cleanBase.match(/^https?:\/\//)) {
        return `${cleanBase}/api`;
    }

    // 相対パス（/api など）の場合、そのまま使用
    // 開発環境でvite proxyが処理する
    return cleanBase;
}