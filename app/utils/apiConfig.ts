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
 * 環境変数の優先順位:
 * 1. VITE_API_BASE_URL
 * 2. API_BASE_URL
 * 3. 開発モード: https://rec-time-be-development.ellan122316.workers.dev
 * 4. 本番モード: https://rec-time-be.ellan122316.workers.dev
 *
 * @returns API BaseURL（末尾スラッシュなし）
 */
export function getApiBaseUrl(): string {
    // 環境変数をチェック (優先順位: VITE_API_BASE_URL > API_BASE_URL)
    const envBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.API_BASE_URL;
    
    // 環境変数がない場合、モードに応じてデフォルトURLを設定
    const defaultBaseUrl = 
        import.meta.env.MODE === 'development' || import.meta.env.PROD === false
            ? 'https://rec-time-be-development.ellan122316.workers.dev'
            : 'https://rec-time-be.ellan122316.workers.dev';
    
    const base = envBaseUrl || defaultBaseUrl;
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