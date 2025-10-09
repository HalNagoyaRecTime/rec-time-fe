// === デバッグ用モックデータ読み込みボタン ===
import React, { useState } from "react";
import { injectMockData } from "~/utils/debugDataInjector";

export default function LoadMockDataButton() {
    const [isOpen, setIsOpen] = useState(false);

    const handleLoadMockData = async (mockType: "default" | "overlap") => {
        const mockName = mockType === "default" ? "通常データ" : "重複テストデータ";
        const confirmed = window.confirm(`${mockName}を読み込みます。\n現在のデータは上書きされますが、よろしいですか？`);

        if (confirmed) {
            await injectMockData(mockType);
        }
        setIsOpen(false);
    };

    // 本番環境では表示しない
    if (import.meta.env.PROD) {
        return null;
    }

    return (
        <div className="fixed bottom-20 left-4 z-50">
            {isOpen && (
                <div className="mb-2 flex flex-col gap-2">
                    <button
                        onClick={() => handleLoadMockData("default")}
                        className="rounded bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:bg-purple-700"
                        title="通常のモックデータ"
                    >
                        📋 通常データ
                    </button>
                    <button
                        onClick={() => handleLoadMockData("overlap")}
                        className="rounded bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:bg-orange-700"
                        title="重複テスト用モックデータ"
                    >
                        📊 重複テスト
                    </button>
                </div>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:bg-purple-700 hover:shadow-xl active:scale-95"
                title="デバッグ用：モックデータを読み込む"
            >
                {isOpen ? "✕" : "📋 Mock"}
            </button>
        </div>
    );
}