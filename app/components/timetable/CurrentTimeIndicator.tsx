import React from "react";

interface CurrentTimeIndicatorProps {
    currentTime: Date;
    hourHeight: number; // 1時間あたりの高さ（px）
    startHour: number; // グリッドの開始時刻
    endHour?: number; // グリッドの終了時刻（デフォルト: 18）
}

/**
 * 現在時刻インジケーター
 * img.pngのデザインに基づいて実装
 */
export default function CurrentTimeIndicator({
    currentTime,
    hourHeight,
    startHour,
    endHour = 18,
}: CurrentTimeIndicatorProps) {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();

    // グリッド上での位置を計算
    let totalMinutesFromStart: number;
    let displayHours = hours;
    let displayMinutes = minutes;

    if (hours < startHour) {
        // 0:00〜8:59 → 9:00の位置に表示
        totalMinutesFromStart = 0;
        displayHours = startHour;
        displayMinutes = 0;
    } else if (hours >= endHour) {
        // 18:00以降 → 18:00の位置に固定
        const maxMinutesFromStart = (endHour - startHour) * 60;
        totalMinutesFromStart = maxMinutesFromStart;
        displayHours = endHour;
        displayMinutes = 0;
    } else {
        // 9:00〜17:59 → 実際の時刻を表示
        totalMinutesFromStart = (hours - startHour) * 60 + minutes;
        displayHours = hours;
        displayMinutes = minutes;
    }

    // 現在時刻（HH:MM形式）- 固定された時刻を表示
    const currentTimeStr = `${displayHours.toString().padStart(2, "0")}:${displayMinutes.toString().padStart(2, "0")}`;

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
