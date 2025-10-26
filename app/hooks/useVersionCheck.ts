// app/hooks/useVersionCheck.ts

import { useEffect, useRef, useCallback } from "react";
import { checkVersionFromBackend, forceCheckVersion as forceCheckVersionUtil } from "~/utils/versionCheckBackend";

export interface VersionUpdateInfo {
    version: string;
    message: string;
}

export interface UseVersionCheckOptions {
    /**
     * 自動チェックを有効にするか
     * @default true
     */
    autoCheck?: boolean;

    /**
     * 起動時チェックを実行するか
     * @default true
     */
    checkOnMount?: boolean;

    /**
     * バックグラウンド復帰時にチェックするか
     * @default true
     */
    checkOnVisibilityChange?: boolean;

    /**
     * フォーカス時にチェックするか
     * @default true
     */
    checkOnFocus?: boolean;

    /**
     * 定期チェックを実行するか
     * @default true
     */
    enablePeriodicCheck?: boolean;

    /**
     * 更新検知時のコールバック
     */
    onUpdateDetected?: (info: VersionUpdateInfo) => void;
}

/**
 * アプリバージョンチェックのカスタムフック
 * 自動チェック、手動チェック、更新検知時のコールバックを提供
 */
export function useVersionCheck(options: UseVersionCheckOptions = {}) {
    const {
        autoCheck = true,
        checkOnMount = true,
        checkOnVisibilityChange = true,
        checkOnFocus = true,
        enablePeriodicCheck = true,
        onUpdateDetected,
    } = options;

    const isCheckingRef = useRef(false);

    // バージョンチェック関数（共通化）
    const checkForUpdates = useCallback(
        async (source: string, skipThrottle: boolean = false) => {
            if (isCheckingRef.current) {
                console.log(`[${source}] 既にチェック中 - スキップ`);
                return;
            }

            isCheckingRef.current = true;

            try {
                const { hasUpdate, latestVersion, skipped } = await checkVersionFromBackend({
                    skipThrottle,
                });

                if (skipped) {
                    console.log(`[${source}] チェックスキップ（5分以内）`);
                    return;
                }

                if (hasUpdate) {
                    console.log(`[${source}] 🆕 新しいバージョンを検出: ${latestVersion}`);

                    // バージョン詳細を取得（データベースから更新内容を取得）
                    const { getVersionDetail } = await import("~/utils/versionCheckBackend");
                    const detail = await getVersionDetail(latestVersion);
                    const message = detail?.message || "新しいバージョンが利用可能です";

                    // コールバックを実行
                    if (onUpdateDetected) {
                        onUpdateDetected({
                            version: latestVersion,
                            message,
                        });
                    }

                    // カスタムイベントを発火（他のコンポーネントに通知）
                    window.dispatchEvent(
                        new CustomEvent("version-update-detected", {
                            detail: {
                                version: latestVersion,
                                message,
                            },
                        })
                    );
                }
            } finally {
                isCheckingRef.current = false;
            }
        },
        [onUpdateDetected]
    );

    // 手動チェック（5分制限を無視）
    const forceCheck = useCallback(async () => {
        console.log("[手動チェック] バージョンチェック開始");
        const { hasUpdate, latestVersion, message } = await forceCheckVersionUtil();

        if (hasUpdate) {
            console.log(`[手動チェック] 🆕 新しいバージョンを検出: ${latestVersion}`);

            if (onUpdateDetected) {
                onUpdateDetected({
                    version: latestVersion,
                    message,
                });
            }

            window.dispatchEvent(
                new CustomEvent("version-update-detected", {
                    detail: {
                        version: latestVersion,
                        message,
                    },
                })
            );
        }

        return { hasUpdate, latestVersion };
    }, [onUpdateDetected]);

    useEffect(() => {
        if (!autoCheck) {
            console.log("[VersionCheck] 自動チェック無効");
            return;
        }

        // 1. 起動時チェック（ページリロード = ユーザーアクション → スロットル回避）
        if (checkOnMount) {
            checkForUpdates("起動時", true);
        }

        // 2. 定期チェック（自動チェック → スロットル適用）
        let initialTimer: NodeJS.Timeout | null = null;
        let periodicInterval: NodeJS.Timeout | null = null;

        if (enablePeriodicCheck) {
            const randomDelay = Math.floor(Math.random() * 4 * 60 * 1000) + 60 * 1000; // 1-5分
            console.log(`[VersionCheck] 初回チェックまで ${Math.floor(randomDelay / 1000 / 60)}分待機`);

            initialTimer = setTimeout(() => {
                checkForUpdates("定期チェック（初回）", false);

                // 5分ごとの定期チェック
                periodicInterval = setInterval(() => {
                    checkForUpdates("定期チェック", false);
                }, 5 * 60 * 1000); // 5分
            }, randomDelay);
        }

        // 3. バックグラウンド復帰時チェック（ユーザーがアプリに戻る = ユーザーアクション → スロットル回避）
        const handleVisibilityChange = () => {
            if (checkOnVisibilityChange && document.visibilityState === "visible") {
                console.log("[VersionCheck] バックグラウンドから復帰");
                checkForUpdates("バックグラウンド復帰", true);
            }
        };

        // 4. フォーカス時チェック（ユーザーがウィンドウにフォーカス = ユーザーアクション → スロットル回避）
        const handleFocus = () => {
            if (checkOnFocus) {
                console.log("[VersionCheck] ウィンドウがフォーカスされました");
                checkForUpdates("フォーカス", true);
            }
        };

        // イベントリスナー登録
        if (checkOnVisibilityChange) {
            document.addEventListener("visibilitychange", handleVisibilityChange);
        }
        if (checkOnFocus) {
            window.addEventListener("focus", handleFocus);
        }

        // クリーンアップ
        return () => {
            if (initialTimer) clearTimeout(initialTimer);
            if (periodicInterval) clearInterval(periodicInterval);
            if (checkOnVisibilityChange) {
                document.removeEventListener("visibilitychange", handleVisibilityChange);
            }
            if (checkOnFocus) {
                window.removeEventListener("focus", handleFocus);
            }
        };
    }, [autoCheck, checkOnMount, checkOnVisibilityChange, checkOnFocus, enablePeriodicCheck, checkForUpdates]);

    return {
        /**
         * 手動でバージョンチェックを実行（5分制限を無視）
         */
        forceCheck,

        /**
         * ユーザーアクションによるバージョンチェック（5分制限を回避）
         */
        checkNow: () => checkForUpdates("手動", true),
    };
}