// 更新モーダルコンポーネント
import { useState, useEffect } from "react";

interface UpdateModalProps {
    onUpdate: () => Promise<void>;
    version: string;
    message: string;
    isDebugMode?: boolean; // デバッグモード（手動再インストール）かどうか
}

export default function UpdateModal({ onUpdate, version, message, isDebugMode = false }: UpdateModalProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isReady, setIsReady] = useState(false); // モーダルが準備完了か

    // モーダル表示後500msは全てのイベントをブロック
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleUpdate = async () => {
        if (!isReady) {
            console.log("[UpdateModal] まだクリック不可");
            return;
        }

        // 更新処理を実行
        setIsUpdating(true);
        try {
            await onUpdate();
            // リロードされるのでここには到達しない
        } catch (error) {
            console.error("[UpdateModal] 更新エラー:", error);
            setIsUpdating(false);
        }
    };

    // 全てのポインターイベントを吸収
    const handlePointerEvent = (e: React.PointerEvent) => {
        if (!isReady) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    // メッセージを改行で分割
    const messageLines = message.split("、").filter((line) => line.trim());

    // 汎用メッセージは非表示（データベースから取得した具体的な更新内容のみ表示）
    const shouldShowMessage =
        message &&
        message !== "新しいバージョンが利用可能です" &&
        message !== "最新版です" &&
        message.trim().length > 0;

    return (
        <div
            className="fixed inset-0 z-[9999] flex h-screen w-full items-center justify-center bg-black/60 backdrop-blur-sm"
            onKeyDown={(e) => e.stopPropagation()}
            onPointerDown={handlePointerEvent}
            onPointerUp={handlePointerEvent}
            onClick={(e) => {
                if (!isReady) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }}
        >
            <div
                className="w-[90%] max-w-md rounded-lg border-1 bg-white p-6 shadow-lg"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
            >
                {isUpdating ? (
                    // ローディング表示
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                        <p className="text-lg font-semibold text-gray-800">アップデート中...</p>
                        <p className="mt-2 text-sm text-gray-500">しばらくお待ちください</p>
                    </div>
                ) : (
                    // 更新確認画面
                    <>
                        <div className="mb-6 text-center">
                            {/*<div className="mb-2 text-4xl">{isDebugMode ? "🔧" : "🎉"}</div>*/}
                            <h2 className="text-xl font-bold text-gray-800">
                                {isDebugMode ? "デバッグモード" : "新しいバージョンがあります"}
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">バージョン {version}</p>
                        </div>

                        {shouldShowMessage && messageLines.length > 0 && (
                            <div className="mb-6 rounded-lg bg-blue-50 p-4">
                                {messageLines.length === 1 ? (
                                    // 単一メッセージの場合はシンプルに表示
                                    <p className="text-sm text-blue-800">{messageLines[0].trim()}</p>
                                ) : (
                                    // 複数メッセージの場合は箇条書きで表示
                                    <>
                                        <h3 className="mb-2 text-sm font-semibold text-blue-900">📝 更新内容</h3>
                                        <ul className="space-y-1">
                                            {messageLines.map((line, index) => (
                                                <li key={index} className="text-sm text-blue-800">
                                                    • {line.trim()}
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleUpdate}
                            className={`w-full rounded-lg py-3 text-base font-bold text-white transition-colors ${
                                !isReady
                                    ? "cursor-not-allowed bg-gray-400 opacity-50"
                                    : "cursor-pointer bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                            }`}
                        >
                            アップデート
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
