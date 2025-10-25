// app/utils/versionCheckBackend.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787"; // ローカル
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://rec-time-be.ellan122316.workers.dev"; // 本番

const LAST_SEEN_VERSION_KEY = "app:last_seen_version";
const LAST_CHECK_TIME_KEY = "app:last_check_time";
const CHECK_INTERVAL = 5 * 60 * 1000; // 5分

// APIリクエスト実行中フラグ（同時実行防止）
let isChecking = false;

/**
 * 最後のチェックから5分経過したか確認
 * iOS PWAのバックグラウンド停止に対応するため、タイマーではなく時刻差分で判定
 */
function shouldCheckVersion(): boolean {
    const lastCheckTime = localStorage.getItem(LAST_CHECK_TIME_KEY);

    // 初回起動時
    if (!lastCheckTime) {
        return true;
    }

    const now = Date.now();
    const lastCheckTimestamp = parseInt(lastCheckTime, 10);
    const elapsed = now - lastCheckTimestamp;
    const remaining = CHECK_INTERVAL - elapsed;

    const elapsedMinutes = Math.floor(elapsed / 1000 / 60);
    const remainingMinutes = Math.ceil(remaining / 1000 / 60);

    console.log(`[VersionCheck] 前回チェック: ${new Date(lastCheckTimestamp).toLocaleTimeString('ja-JP')}`);
    console.log(`[VersionCheck] 現在時刻: ${new Date(now).toLocaleTimeString('ja-JP')}`);
    console.log(`[VersionCheck] 経過時間: ${elapsedMinutes}分 / 制限: 5分`);

    if (remaining > 0) {
        console.log(`[VersionCheck] 次回チェックまであと ${remainingMinutes}分 - スキップ`);
        return false;
    }

    console.log(`[VersionCheck] 5分以上経過 - APIリクエスト実行`);
    return true;
}

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
        console.log('[VersionCheck] 既にチェック実行中 - スキップ');
        return { hasUpdate: false, latestVersion: "実行中", skipped: true };
    }

    // 5分経過していなければスキップ
    if (!shouldCheckVersion()) {
        return { hasUpdate: false, latestVersion: "チェックスキップ", skipped: true };
    }

    isChecking = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/version`, {
            cache: "no-cache",
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const latestVersion = data.version;

        // チェック時刻を保存（タイムスタンプ: ミリ秒）
        const now = Date.now();
        localStorage.setItem(LAST_CHECK_TIME_KEY, now.toString());
        console.log(`[VersionCheck] チェック時刻保存: ${new Date(now).toLocaleString('ja-JP')}`);

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
 * 強制的にバージョンチェック（5分制限を無視）
 */
export async function forceCheckVersion(): Promise<{
    hasUpdate: boolean;
    latestVersion: string;
}> {
    // 最終チェック時刻をリセット
    localStorage.removeItem(LAST_CHECK_TIME_KEY);

    const result = await checkVersionFromBackend();
    return {
        hasUpdate: result.hasUpdate,
        latestVersion: result.latestVersion,
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
        const response = await fetch(`${API_BASE_URL}/api/version/detail/${version}`, {
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
