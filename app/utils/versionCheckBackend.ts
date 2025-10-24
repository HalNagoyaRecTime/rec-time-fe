// app/utils/versionCheckBackend.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787"; // ローカル
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://rec-time-be.ellan122316.workers.dev"; // 本番

const LAST_SEEN_VERSION_KEY = "app:last_seen_version";
const LAST_CHECK_TIME_KEY = "app:last_check_time";
const CHECK_INTERVAL = 5 * 60 * 1000; // 5分

/**
 * 最後のチェックから5分経過したか確認
 */
function shouldCheckVersion(): boolean {
    const lastCheckTime = localStorage.getItem(LAST_CHECK_TIME_KEY);
    if (!lastCheckTime) return true;
    
    const elapsed = Date.now() - parseInt(lastCheckTime, 10);
    const remaining = CHECK_INTERVAL - elapsed;
    
    if (remaining > 0) {
        console.log(`[VersionCheck] 次回チェックまであと ${Math.ceil(remaining / 1000 / 60)}分`);
        return false;
    }
    
    return true;
}

/**
 * バックエンドからバージョン情報を取得
 */
export async function checkVersionFromBackend(): Promise<{
    hasUpdate: boolean;
    latestVersion: string;
    updatedAt?: string;
    message?: string;
    skipped?: boolean;
}> {
    // 5分経過していなければスキップ
    if (!shouldCheckVersion()) {
        return { hasUpdate: false, latestVersion: "チェックスキップ", skipped: true };
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/version`, {
            cache: "no-cache",
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const latestVersion = data.version;
        const updatedAt = data.updated_at;
        const message = data.message;
        
        // チェック時刻を保存
        localStorage.setItem(LAST_CHECK_TIME_KEY, Date.now().toString());
        
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
            console.log(`📅 更新日時: ${updatedAt}`);
            console.log(`📝 変更内容: ${message}`);
        } else {
            console.log(`[VersionCheck] バージョン確認完了 - 最新版です (${latestVersion})`);
        }
        
        return { hasUpdate, latestVersion, updatedAt, message, skipped: false };
    } catch (error) {
        console.error("[VersionCheck] バックエンドチェックエラー:", error);
        return { hasUpdate: false, latestVersion: "不明", skipped: false };
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
 * 強制的にバージョンチェック（5分制限を無視）
 */
export async function forceCheckVersion(): Promise<{
    hasUpdate: boolean;
    latestVersion: string;
    updatedAt?: string;
    message?: string;
}> {
    // 最終チェック時刻をリセット
    localStorage.removeItem(LAST_CHECK_TIME_KEY);
    
    const result = await checkVersionFromBackend();
    return {
        hasUpdate: result.hasUpdate,
        latestVersion: result.latestVersion,
        updatedAt: result.updatedAt,
        message: result.message,
    };
}

/**
 * 現在のバージョンを取得（表示用）
 */
export async function getCurrentVersion(): Promise<string> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/version`, {
            cache: "no-cache",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data.version;
    } catch (error) {
        console.error("[VersionCheck] バージョン取得エラー:", error);
        return "不明";
    }
}
