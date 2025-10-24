// 更新モーダルコンポーネント
import { useState } from "react";

interface UpdateModalProps {
    onUpdate: () => Promise<void>;
    version: string;
    message: string;
}

export default function UpdateModal({ onUpdate, version, message }: UpdateModalProps) {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            await onUpdate();
            // リロードされるのでここには到達しない
        } catch (error) {
            console.error("[UpdateModal] 更新エラー:", error);
            setIsUpdating(false);
        }
    };

    // メッセージを改行で分割
    const messageLines = message.split('、').filter(line => line.trim());

    return (
        <div 
            className="fixed inset-0 z-[9999] flex h-screen w-full items-center justify-center bg-black/60 backdrop-blur-sm"
            onKeyDown={(e) => e.stopPropagation()} // ESCキー無効化
        >
            <div className="w-[90%] max-w-md rounded-2xl bg-white p-6 shadow-2xl">
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
                            <div className="mb-2 text-4xl">🎉</div>
                            <h2 className="text-xl font-bold text-gray-800">
                                新しいバージョンがあります
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                バージョン {version}
                            </p>
                        </div>

                        {messageLines.length > 0 && (
                            <div className="mb-6 rounded-lg bg-blue-50 p-4">
                                <h3 className="mb-2 text-sm font-semibold text-blue-900">
                                    📝 更新内容
                                </h3>
                                <ul className="space-y-1">
                                    {messageLines.map((line, index) => (
                                        <li
                                            key={index}
                                            className="text-sm text-blue-800"
                                        >
                                            • {line.trim()}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mb-4 rounded-lg bg-gray-100 p-3">
                            <p className="text-xs text-gray-600">
                                ℹ️ ユーザーデータは保持されます
                            </p>
                        </div>

                        <button
                            onClick={handleUpdate}
                            className="w-full cursor-pointer rounded-lg bg-blue-600 py-3 text-base font-bold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
                        >
                            アップデート
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
