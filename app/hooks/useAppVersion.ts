import { useState, useEffect } from "react";

/**
 * バージョン番号を比較する（セマンティックバージョニング）
 * @param v1 比較対象のバージョン（例: "25.1.2"）
 * @param v2 基準バージョン（例: "25.1.1"）
 * @returns v1がv2より新しい場合true、それ以外false
 */
function compareVersions(v1: string, v2: string): boolean {
    // "..." などの特殊な値はfalseを返す
    if (v1 === "..." || v2 === "..." || !v1 || !v2) {
        return false;
    }

    const parts1 = v1.split(".").map(Number);
    const parts2 = v2.split(".").map(Number);
    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;

        if (num1 > num2) return true;
        if (num1 < num2) return false;
    }

    return false; // 同じバージョン
}

/**
 * アプリのバージョン情報を取得するカスタムフック
 *
 * 動作:
 * - localStorageの "app:last_seen_version" を読み取る（表示専用）
 * - APIアクセスは useVersionCheck が一元管理
 * - バージョン変更をリアルタイムで反映（カスタムイベントで検知）
 *
 * @returns アプリのバージョン文字列（例: "25.1.0"）
 */
export function useAppVersion(): string {
    const [appVersion, setAppVersion] = useState<string>(() => {
        // 初期値をlocalStorageから取得（なければ空文字）
        return localStorage.getItem("app:last_seen_version") || "";
    });

    useEffect(() => {
        // 初回マウント時にlocalStorageがない場合、APIから直接取得
        const initializeVersion = async () => {
            const storedVersion = localStorage.getItem("app:last_seen_version");
            if (!storedVersion) {
                try {
                    const { getCurrentVersion } = await import("~/utils/versionCheckBackend");
                    const version = await getCurrentVersion();
                    if (version && version !== "不明") {
                        localStorage.setItem("app:last_seen_version", version);
                        setAppVersion(version);
                    } else {
                        console.warn("[useAppVersion] API取得失敗 - 空文字のまま");
                    }
                } catch (error) {
                    console.error("[useAppVersion] API取得エラー:", error);
                }
            }
        };

        void initializeVersion();
    }, []); // 初回のみ実行

    useEffect(() => {
        // localStorageの変更を監視（他のタブやuseVersionCheckからの更新を検知）
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "app:last_seen_version" && e.newValue) {
                setAppVersion(e.newValue);
            }
        };

        // カスタムイベントを監視（同一タブ内での更新を検知）
        const handleVersionUpdate = ((e: CustomEvent) => {
            const version = e.detail?.version;
            if (version) {
                // localStorageも更新して、定期同期による上書きを防ぐ
                localStorage.setItem("app:last_seen_version", version);
                setAppVersion(version);
            }
        }) as EventListener;

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("version-update-detected", handleVersionUpdate);

        // 定期的にlocalStorageをチェック（念のため）
        // 注意: localStorageの方が明らかに新しい場合のみ更新
        const syncInterval = setInterval(() => {
            const currentVersion = localStorage.getItem("app:last_seen_version");
            if (currentVersion && currentVersion !== appVersion) {
                // バージョン番号を比較（例: "25.1.2" > "25.1.1"）
                const isNewer = compareVersions(currentVersion, appVersion);
                if (isNewer) {
                    console.log(`[useAppVersion] localStorage同期（新バージョン検出）: ${currentVersion}`);
                    setAppVersion(currentVersion);
                } else {
                    console.log(
                        `[useAppVersion] localStorage同期スキップ（古いバージョン）: ${currentVersion} vs ${appVersion}`
                    );
                }
            }
        }, 2000); // 2秒ごと（負荷軽減）

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("version-update-detected", handleVersionUpdate);
            clearInterval(syncInterval);
        };
    }, [appVersion]);

    return appVersion;
}
