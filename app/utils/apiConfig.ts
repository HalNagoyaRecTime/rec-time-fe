/**
 * API設定ユーティリティ
 * 開発環境と本番環境で一貫したAPI URLを提供
 * API設定ユーティリティ
 * 개발 환경과 프로덕션 환경에서 일관된 API URL을 제공
 */

// import { logger } from './logger'; // ログは最小限に
// import { logger } from './logger'; // 로그는 최소한으로

/**
 * API BaseURLを取得
 * API BaseURL을 획득
 *
 * 動作:
 * - 開発環境: "/api" を返す（vite proxyが処理）
 * - 本番環境: "https://backend.example.com" → "https://backend.example.com/api" に変換
 * 동작:
 * - 개발 환경: "/api"를 반환 (vite proxy가 처리)
 * - 프로덕션 환경: "https://backend.example.com" → "https://backend.example.com/api"로 변환
 *
 * @returns API BaseURL（末尾スラッシュなし）
 * @returns API BaseURL (끝 슬래시 없음)
 */
export function getApiBaseUrl(): string {
    const base = import.meta.env.VITE_API_BASE_URL || "https://rec-time-be.ellan122316.workers.dev/";
    const cleanBase = base.replace(/\/$/, "");

    // フルURL（http:// または https:// で始まる）の場合、/api を追加
    // 本番環境または開発環境でプロキシを使わない直接アクセスの場合
    // 풀 URL (http:// 또는 https://로 시작)인 경우, /api를 추가
    // 프로덕션 환경 또는 개발 환경에서 프록시를 사용하지 않는 직접 접근의 경우
    if (cleanBase.match(/^https?:\/\//)) {
        const apiUrl = `${cleanBase}/api`;
        // API BaseURL設定完了（ログなし）
        // API BaseURL 설정 완료 (로그 없음)
        return apiUrl;
    }

    // 相対パス（/api など）の場合、そのまま使用
    // 開発環境でvite proxyが処理する
    // 상대 경로 (/api 등)인 경우, 그대로 사용
    // 개발 환경에서 vite proxy가 처리
    // API BaseURL設定完了（ログなし）
    // API BaseURL 설정 완료 (로그 없음)
    return cleanBase;
}