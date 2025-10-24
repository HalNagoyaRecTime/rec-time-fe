// アプリケーションバージョン管理
// ※ このバージョンを変更すると自動更新が発火します

export const APP_VERSION = "25.1.3";

// リリースノート（バージョンごとの変更内容）
export const RELEASE_NOTES: Record<string, string[]> = {
    "25.1.3": ["自動更新機能を追加", "バージョン管理システムの実装", "リリースノート表示機能", "キャッシュ管理の改善"],
    "25.1.0": ["自動更新機能を追加", "バージョン管理システムの実装", "リリースノート表示機能", "キャッシュ管理の改善"],
};

// 現在のバージョンのリリースノートを取得
export function getCurrentReleaseNotes(): string[] {
    return RELEASE_NOTES[APP_VERSION] || [];
}
