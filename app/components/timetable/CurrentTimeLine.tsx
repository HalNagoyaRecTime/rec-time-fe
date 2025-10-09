import React from "react";

interface CurrentTimeLineProps {
    currentTime: Date;
    hourHeight: number; // 1時間あたりの高さ（px）
    startHour: number; // グリッドの開始時刻
}

/**
 * 現在時刻を示す横棒ライン
 * 右側のカレンダーエリアに表示
 */
export default function CurrentTimeLine({ currentTime, hourHeight, startHour }: CurrentTimeLineProps) {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();

    // グリッド上での位置を計算
    const totalMinutesFromStart = (hours - startHour) * 60 + minutes;
    const topPosition = (totalMinutesFromStart / 60) * hourHeight;

    return (
        <div className="-translate- absolute right-0 left-0 z-50" style={{ top: `${topPosition}px` }}>
            {/* 現在時刻を示す横棒（オレンジ色） */}
            <div className="h-[2px] w-full bg-[#FFB400]"></div>
        </div>
    );
}
