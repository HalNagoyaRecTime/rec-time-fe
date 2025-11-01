// app/utils/versionCheckBackend.ts

import { getApiBaseUrl } from "~/config/apiConfig";

const LAST_SEEN_VERSION_KEY = "app:last_seen_version";

// APIリクエスト実行中フラグ（同時実行防止）
let isChecking = false;

/**
 * バックエンドからバージョン情報を取得
 * GET /api/version - バージョン番号のみ取得（更新確認用）
 */
export async function checkVersionFromBackend(): Promise<{
    hasUpdate: boolean;
    latestVersion: string;
    skipped?: boolean;
}> {
    // 既に実行中の場合はスキップ（React Strict Mode対応）
    if (isChecking) {
        console.log("[VersionCheck] 既にチェック実行中 - スキップ");
        return { hasUpdate: false, latestVersion: "実行中", skipped: true };
    }

    isChecking = true;

    try {
        const API_BASE_URL = getApiBaseUrl();
        const response = await fetch(`${API_BASE_URL}/version`, {
            cache: "no-cache",
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const latestVersion = data.version;

        // LocalStorageから最後に確認したバージョンを取得
        const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY);

        // バージョン比較
        const hasUpdate = lastSeenVersion !== null && lastSeenVersion !== latestVersion;

        if (!lastSeenVersion) {
            // 初回起動時
            console.log(`[VersionCheck] 初回起動 - バージョン: ${latestVersion}`);
            localStorage.setItem(LAST_SEEN_VERSION_KEY, latestVersion);
        } else if (hasUpdate) {
            console.log(`🆕 新バージョン検出: ${latestVersion} (前回: ${lastSeenVersion})`);
        } else {
            console.log(`[VersionCheck] バージョン確認完了 - 最新版です (${latestVersion})`);
        }

        return { hasUpdate, latestVersion, skipped: false };
    } catch (error) {
        console.error("[VersionCheck] バックエンドチェックエラー:", error);
        return { hasUpdate: false, latestVersion: "不明", skipped: false };
    } finally {
        isChecking = false;
    }
}

/**
 * バージョン確認済みとしてマーク
 */
export function markVersionAsSeen(version: string): void {
    localStorage.setItem(LAST_SEEN_VERSION_KEY, version);
    console.log(`[VersionCheck] バージョン ${version} を確認済みとしてマーク`);
}

/**
 * バージョン詳細情報を取得
 * GET /api/version/detail/:version - バージョン詳細取得（内容確認用）
 */
export async function getVersionDetail(version: string): Promise<{
    version: string;
    updated_at: string;
    message: string;
} | null> {
    try {
        const API_BASE_URL = getApiBaseUrl();
        const response = await fetch(`${API_BASE_URL}/version/detail/${version}`, {
            cache: "no-cache",
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return {
            version: data.version,
            updated_at: data.updated_at,
            message: data.message,
        };
    } catch (error) {
        console.error("[VersionCheck] バージョン詳細取得エラー:", error);
        return null;
    }
}
