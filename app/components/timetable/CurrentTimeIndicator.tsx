import React from "react";

interface CurrentTimeIndicatorProps {
    currentTime: Date;
    hourHeight: number; // 1時間あたりの高さ（px）
    startHour: number; // グリッドの開始時刻
}

/**
 * 現在時刻インジケーター
 * img.pngのデザインに基づいて実装
 */
export default function CurrentTimeIndicator({ currentTime, hourHeight, startHour }: CurrentTimeIndicatorProps) {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();

    // 現在時刻（HH:MM形式）
    const currentTimeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    // グリッド上での位置を計算
    const totalMinutesFromStart = (hours - startHour) * 60 + minutes;
    const topPosition = (totalMinutesFromStart / 60) * hourHeight - 9;

    return (
        <div className="absolute left-0 z-60 w-full" style={{ top: `${topPosition}px` }}>
            {/* 現在時刻バッジ（黄色背景） */}
            <div className="flex h-[18px] w-full items-center justify-end rounded-r-full bg-[#FFB400] pr-2">
                <p className="text-sm font-medium text-blue-950">{currentTimeStr}</p>
            </div>
        </div>
    );
}
