import React, { useState } from "react";
import { FaGear } from "react-icons/fa6";

interface DebugTimePickerProps {
    debugOffset: number;
    setDebugOffset: (offset: number) => void;
    showTimeIndicator: boolean;
    setShowTimeIndicator: (show: boolean) => void;
}

/**
 * デバッグ用の時刻操作コンポーネント（簡略版）
 * 本番環境用: 最小限の機能のみ
 */
export default function DebugTimePicker({
    debugOffset,
    setDebugOffset,
    showTimeIndicator,
    setShowTimeIndicator,
}: DebugTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const adjustTime = (minutes: number) => {
        setDebugOffset(debugOffset + minutes * 60 * 1000);
    };

    const resetTime = () => {
        setDebugOffset(0);
    };

    const formatOffset = () => {
        const totalMinutes = Math.floor(debugOffset / 60000);
        const hours = Math.floor(Math.abs(totalMinutes) / 60);
        const minutes = Math.abs(totalMinutes) % 60;
        const sign = totalMinutes >= 0 ? "+" : "-";
        return `${sign}${hours}h ${minutes}m`;
    };

    return (
        <>
            {/* トグルボタン（画面右下） */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-white shadow-lg hover:bg-gray-600"
                title="デバッグメニュー"
            >
                <FaGear />
            </button>

            {/* デバッグパネル */}
            {isOpen && (
                <div className="fixed bottom-16 left-4 z-50 w-64 rounded-lg bg-gray-800 p-3 text-white shadow-lg">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-bold">デバッグモード</span>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                            ✕
                        </button>
                    </div>

                    {/* 時刻インジケーター表示切り替え */}
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs">時刻バー表示</span>
                        <button
                            onClick={() => setShowTimeIndicator(!showTimeIndicator)}
                            className={`rounded px-3 py-1 text-xs ${
                                showTimeIndicator ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-500"
                            }`}
                        >
                            {showTimeIndicator ? "ON" : "OFF"}
                        </button>
                    </div>

                    {/* 時刻調整 */}
                    {showTimeIndicator && (
                        <>
                            <div className="mb-2 text-center text-xs text-gray-400">{formatOffset()}</div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => adjustTime(-1)}
                                    className="flex-1 rounded bg-red-500 px-2 py-1 text-xs hover:bg-red-600"
                                >
                                    -1m
                                </button>
                                <button
                                    onClick={resetTime}
                                    className="flex-1 rounded bg-green-600 px-2 py-1 text-xs hover:bg-green-700"
                                >
                                    リセット
                                </button>
                                <button
                                    onClick={() => adjustTime(1)}
                                    className="flex-1 rounded bg-blue-500 px-2 py-1 text-xs hover:bg-blue-600"
                                >
                                    +1m
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
