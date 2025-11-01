// app/hooks/useAppStateSync.ts

import { useEffect, useRef, useCallback, useState } from "react";
import { checkVersionFromBackend } from "~/utils/versionCheckBackend";
import { getLastStoredDataUpdateCount, getDataUpdateCount, updateLastDataUpdateCount } from "~/utils/dataUpdateChecker";
import { downloadAndSaveEvents } from "~/utils/dataFetcher";

export interface UseAppStateSyncOptions {
    /**
     * 自動チェックを有効にするか
     * @default true
     */
    autoCheck?: boolean;

    /**
     * 起動時チェックを実行するか
     * @default true
     * 注：初期化が root.tsx で済んでいる場合は false にする
     */
    checkOnMount?: boolean;

    /**
     * 初回ロード済みフラグ（重複初期化を防ぐ）
     * root.tsx で初期化済みの場合は true
     * @default false
     */
    skipInitialMount?: boolean;

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
     * 手動トリガー関数を返すか
     * @default false
     */
    enableManualTrigger?: boolean;

    /**
     * ネットワーク復帰時にチェックするか
     * @default true
     */
    checkOnNetworkRecovery?: boolean;

    /**
     * データ変更検出時のコールバック
     */
    onDataUpdated?: () => void;

    /**
     * バージョン更新検出時のコールバック
     */
    onVersionUpdated?: (info: { version: string; message: string }) => void;
}

export interface UseAppStateSyncReturn {
    /**
     * 手動で同期を実行する関数
     */
    sync: () => Promise<void>;
    /**
     * 同期中かどうか
     */
    isSyncing: boolean;
}

/**
 * アプリの状態を同期する共通フック
 * - バージョンチェック
 * - データ更新チェック
 *
 * 実行タイミング：
 * - 起動時
 * - バックグラウンド復帰時
 * - ウィンドウフォーカス時
 * - 定期実行（5分）
 * - ネットワーク復帰時
 * - 手動トリガー
 */
export function useAppStateSync(options: UseAppStateSyncOptions = {}): UseAppStateSyncReturn {
    const {
        autoCheck = true,
        checkOnMount = true,
        skipInitialMount = false,
        checkOnVisibilityChange = true,
        checkOnFocus = true,
        enablePeriodicCheck = true,
        checkOnNetworkRecovery = true,
        enableManualTrigger = false,
        onDataUpdated,
        onVersionUpdated,
    } = options;

    const [isSyncing, setIsSyncing] = useState(false);
    const isCheckingRef = useRef(false);

    /**
     * アプリ状態を同期する共通関数
     */
    const performSync = useCallback(
        async (source: string) => {
            if (isCheckingRef.current) {
                console.log(`[AppStateSync] 既にチェック中 - スキップ (${source})`);
                return;
            }

            isCheckingRef.current = true;
            setIsSyncing(true);

            try {
                console.log(`[AppStateSync] 同期開始 (${source})`);

                // 🔍 1. データ更新チェック
                const lastCount = getLastStoredDataUpdateCount();
                const currentCount = await getDataUpdateCount();

                console.log(`[AppStateSync] データ更新ログ: ${lastCount} → ${currentCount}`);

                if (currentCount !== -1 && currentCount > lastCount) {
                    console.log(`[AppStateSync] データ変更を検出！`);

                    // 🆕 カウントを更新（ループを防ぐ）
                    updateLastDataUpdateCount(currentCount);

                    // 🆕 イベントデータを取得（skipUpdateCheck=false で、既にカウントは更新済み）
                    const eventsResult = await downloadAndSaveEvents(undefined, false);
                    if (eventsResult.success) {
                        console.log(`[AppStateSync] イベントを更新: ${eventsResult.events.length}件`);
                    }

                    // イベント発火
                    if (onDataUpdated) {
                        onDataUpdated();
                    }

                    // カスタムイベント発火
                    window.dispatchEvent(
                        new CustomEvent("data-updated-modal", {
                            detail: {
                                message: "データが更新されました",
                            },
                        })
                    );
                } else if (currentCount !== -1) {
                    // 🆕 変更なくても最新カウントで更新（定期チェック用）
                    updateLastDataUpdateCount(currentCount);
                }

                // 🔍 2. バージョンチェック
                const { hasUpdate, latestVersion } = await checkVersionFromBackend();

                if (hasUpdate) {
                    console.log(`[AppStateSync] 新バージョン検出: ${latestVersion}`);

                    const { getVersionDetail } = await import("~/utils/versionCheckBackend");
                    const detail = await getVersionDetail(latestVersion);
                    const message = detail?.message || "新しいバージョンが利用可能です";

                    if (onVersionUpdated) {
                        onVersionUpdated({
                            version: latestVersion,
                            message,
                        });
                    }

                    // カスタムイベント発火
                    window.dispatchEvent(
                        new CustomEvent("version-update-detected", {
                            detail: {
                                version: latestVersion,
                                message,
                            },
                        })
                    );
                }

                console.log(`[AppStateSync] 同期完了 (${source})`);
            } catch (error) {
                console.error(`[AppStateSync] 同期中にエラー (${source}):`, error);
            } finally {
                isCheckingRef.current = false;
                setIsSyncing(false);
            }
        },
        [onDataUpdated, onVersionUpdated]
    );

    /**
     * 手動同期関数
     */
    const sync = useCallback(async () => {
        await performSync("手動トリガー");
    }, [performSync]);

    // 自動実行の初期化
    useEffect(() => {
        if (!autoCheck) {
            console.log("[AppStateSync] 自動チェック無効");
            return;
        }

        // 1. 起動時チェック（skipInitialMountで制御：root.tsxで既に初期化済みの場合はスキップ）
        if (checkOnMount && !skipInitialMount) {
            void performSync("起動時");
        }

        // 2. 定期チェック
        let initialTimer: NodeJS.Timeout | null = null;
        let periodicInterval: NodeJS.Timeout | null = null;

        if (enablePeriodicCheck) {
            const randomDelay = Math.floor(Math.random() * 4 * 60 * 1000) + 60 * 1000; // 1-5分
            console.log(`[AppStateSync] 初回チェックまで ${Math.floor(randomDelay / 1000 / 60)}分待機`);

            initialTimer = setTimeout(() => {
                void performSync("定期チェック（初回）");

                // 5分ごとの定期チェック
                periodicInterval = setInterval(
                    () => {
                        void performSync("定期チェック");
                    },
                    5 * 60 * 1000
                ); // 5分
            }, randomDelay);
        }

        // 3. バックグラウンド復帰時チェック
        const handleVisibilityChange = () => {
            if (checkOnVisibilityChange && document.visibilityState === "visible") {
                console.log("[AppStateSync] バックグラウンドから復帰");
                void performSync("バックグラウンド復帰");
            }
        };

        // 4. フォーカス時チェック
        const handleFocus = () => {
            if (checkOnFocus) {
                console.log("[AppStateSync] ウィンドウがフォーカスされました");
                void performSync("フォーカス");
            }
        };

        // 5. ネットワーク復帰時チェック
        const handleOnline = () => {
            if (checkOnNetworkRecovery) {
                console.log("[AppStateSync] オンラインに復帰");
                void performSync("ネットワーク復帰");
            }
        };

        // イベントリスナー登録
        if (checkOnVisibilityChange) {
            document.addEventListener("visibilitychange", handleVisibilityChange);
        }
        if (checkOnFocus) {
            window.addEventListener("focus", handleFocus);
        }
        if (checkOnNetworkRecovery) {
            window.addEventListener("online", handleOnline);
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
            if (checkOnNetworkRecovery) {
                window.removeEventListener("online", handleOnline);
            }
        };
    }, [
        autoCheck,
        checkOnMount,
        skipInitialMount,
        checkOnVisibilityChange,
        checkOnFocus,
        enablePeriodicCheck,
        checkOnNetworkRecovery,
        performSync,
    ]);

    return {
        sync: enableManualTrigger ? sync : () => Promise.resolve(),
        isSyncing,
    };
}
