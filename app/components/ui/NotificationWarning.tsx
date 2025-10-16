// 通知に関する重要な注意喚起コンポーネント

import React from "react";
import { FaBell, FaExclamationTriangle } from "react-icons/fa";

interface NotificationWarningProps {
    isVisible: boolean;
    onDismiss: () => void;
}

export default function NotificationWarning({ isVisible, onDismiss }: NotificationWarningProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
            <div className="max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center gap-3">
                    <FaBell className="h-6 w-6 text-[#000D91]" />
                    <h3 className="text-lg font-bold text-[#000D91]">通知を受け取るために</h3>
                </div>

                <div className="mb-4 space-y-3 text-sm text-gray-700">
                    <div className="flex gap-2">
                        <FaExclamationTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                        <p>
                            <strong>重要：</strong>
                            確実に通知を受け取るには、イベント当日は
                            <strong className="text-[#000D91]">アプリを開いたまま</strong>
                            にしておいてください。
                        </p>
                    </div>

                    <div className="ml-6 space-y-2 text-xs">
                        <p>✅ アプリを最小化してもOK</p>
                        <p>✅ 画面をオフにしてもOK</p>
                        <p>❌ ブラウザを完全に閉じると通知が届きません</p>
                    </div>

                    <div className="mt-4 rounded-md bg-blue-50 p-3 text-xs">
                        <p className="font-semibold text-[#000D91]">💡 ヒント</p>
                        <p className="mt-1 text-gray-600">
                            ホーム画面に追加してPWAとして使用すると、より確実に通知を受け取れます。
                        </p>
                    </div>
                </div>

                <button
                    onClick={onDismiss}
                    className="w-full rounded-lg bg-[#000D91] py-3 font-semibold text-white transition-colors hover:bg-[#000D91]/90"
                >
                    理解しました
                </button>
            </div>
        </div>
    );
}
