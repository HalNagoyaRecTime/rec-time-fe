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
 * 1. VITE_API_BASE_URL (최우선)
 * 2. 환경 변수가 없으면: 개발 모드 → 개발 서버, 프로덕션 모드 → 프로덕션 서버
 *
 * @returns API BaseURL（末尾スラッシュなし）
 */
export function getApiBaseUrl(): string {
    // 환경 변수가 설정되어 있으면 우선 사용
    const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
    
    // 환경 변수가 없으면 모드에 따라 기본값 설정
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