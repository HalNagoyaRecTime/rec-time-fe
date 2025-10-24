// バージョン比較ユーティリティ

const VERSION_STORAGE_KEY = "app:version";

/**
 * セマンティックバージョニング形式の比較
 * @param oldVersion 旧バージョン (例: "25.0.9")
 * @param newVersion 新バージョン (例: "25.1.0")
 * @returns newVersion > oldVersion の場合 true
 */
export function isNewerVersion(oldVersion: string | null, newVersion: string): boolean {
    if (!oldVersion) return true; // 初回起動時は更新不要

    const oldParts = oldVersion.split('.').map(Number);
    const newParts = newVersion.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
        const oldPart = oldParts[i] || 0;
        const newPart = newParts[i] || 0;

        if (newPart > oldPart) return true;
        if (newPart < oldPart) return false;
    }

    return false; // 同じバージョン
}

/**
 * LocalStorageから保存済みバージョンを取得
 */
export function getSavedVersion(): string | null {
    return localStorage.getItem(VERSION_STORAGE_KEY);
}

/**
 * バージョンをLocalStorageに保存
 */
export function saveVersion(version: string): void {
    localStorage.setItem(VERSION_STORAGE_KEY, version);
}

/**
 * 更新が必要かチェック
 */
export function needsUpdate(currentVersion: string): boolean {
    const savedVersion = getSavedVersion();
    return isNewerVersion(savedVersion, currentVersion);
}
